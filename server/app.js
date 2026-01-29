const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Global error catcher for the loading phase
let startupError = null;
let models = null;

try {
    // Attempt to load models
    models = require('./models');
} catch (e) {
    console.error('CRITICAL STARTUP ERROR (Models):', e);
    startupError = e;
}

// Middleware
app.use(cors({
    origin: true, // Allow all for debugging, adjust in prod
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// --- ROUTES ---

// Simple Ping
app.get('/api/ping', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        node: process.version,
        env: process.env.NODE_ENV
    });
});

// Deep Debug Route
app.get('/api/debug-env', async (req, res) => {
    const dbStatus = models && models.sequelize ? 'initialized' : 'failed/missing';
    let dbConnection = 'untested';

    if (models && models.sequelize) {
        try {
            await models.sequelize.authenticate();
            dbConnection = 'connected';
        } catch (e) {
            dbConnection = 'failed: ' + e.message;
        }
    }

    res.json({
        startupError: startupError ? { message: startupError.message, stack: startupError.stack } : null,
        database: {
            status: dbStatus,
            connection: dbConnection,
            url_present: !!process.env.DATABASE_URL
        },
        environment: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT
        },
        modules: {
            express: !!require('express'),
            sequelize: !!require('sequelize')
        }
    });
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        if (!models || !models.sequelize) throw new Error('Models not loaded');
        await models.sequelize.authenticate();
        res.json({ status: 'online', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// --- AUTH ---
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    try {
        if (startupError) {
            return res.status(500).json({
                message: 'Servidor en estado de error de inicio',
                details: startupError.message
            });
        }

        if (!models || !models.User) {
            return res.status(500).json({
                message: 'Base de datos no disponible',
                hint: 'Revisa /api/debug-env para más detalles'
            });
        }

        const user = await models.User.findOne({ where: { email } });
        if (user && user.password === password) {
            if (!user.isActive) {
                return res.status(403).json({ message: 'Cuenta desactivada' });
            }
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                SECRET_KEY,
                { expiresIn: '24h' }
            );
            res.json({ token, role: user.role });
        } else {
            res.status(401).json({ message: 'Email o contraseña incorrectos' });
        }
    } catch (error) {
        console.error('LOGIN ERROR:', error);
        res.status(500).json({
            message: 'Error interno en el servidor',
            details: error.message
        });
    }
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- LINK & USER ROUTES (Restored) ---

// Create Link
app.post('/api/links', authenticateToken, async (req, res) => {
    const { title, description, imageUrl, destinationUrl, buttonText } = req.body;
    try {
        const newLink = await models.Link.create({
            id: Math.random().toString(36).substr(2, 9),
            title, description, imageUrl, destinationUrl, buttonText,
            createdBy: req.user.id
        });
        res.json(newLink);
    } catch (error) {
        res.status(500).json({ message: 'Error creando enlace: ' + error.message });
    }
});

// Get Link Public
app.get('/api/links/:id', async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (link) res.json(link);
        else res.status(404).json({ message: 'Enlace no encontrado' });
    } catch (error) {
        res.status(500).json({ message: 'Error recuperando enlace' });
    }
});

// Update Link
app.put('/api/links/:id', authenticateToken, async (req, res) => {
    const { title, description, imageUrl, destinationUrl, buttonText } = req.body;
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        await link.update({ title, description, imageUrl, destinationUrl, buttonText });
        res.json(link);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete Link
app.delete('/api/links/:id', authenticateToken, async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        await link.destroy();
        res.json({ message: 'Enlace eliminado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Stats
app.get('/api/user/stats', authenticateToken, async (req, res) => {
    try {
        const linksCount = await models.Link.count({ where: { createdBy: req.user.id } });
        const sessionsCount = await models.Session.count({
            include: [{ model: models.Link, where: { createdBy: req.user.id } }]
        });
        res.json({ totalLinks: linksCount, totalLocations: sessionsCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Links
app.get('/api/user/links', authenticateToken, async (req, res) => {
    try {
        const links = await models.Link.findAll({
            where: { createdBy: req.user.id },
            order: [['createdAt', 'DESC']]
        });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Admin Links
app.get('/api/admin/links', authenticateToken, async (req, res) => {
    try {
        const links = await models.Link.findAll({ include: models.User });
        res.json(links);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// User Sessions
app.get('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await models.Session.findAll({
            include: [{ model: models.Link, where: { createdBy: req.user.id } }],
            order: [['timestamp', 'DESC']]
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Setup DB
app.get('/api/setup-db', async (req, res) => {
    try {
        if (!models || !models.sequelize) throw new Error('No sequelize instance');
        await models.sequelize.sync({ alter: true });
        res.json({ message: 'Database synced successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Global Handler
app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({ error: 'Fallo catastrófico', message: err.message });
});

module.exports = app;
