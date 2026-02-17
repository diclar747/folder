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

// Root Route (Welcome)
app.get('/', (req, res) => {
    res.json({
        message: 'Ubicar API Server is running',
        status: 'online',
        endpoints: {
            health: '/api/health',
            debug: '/api/debug-env'
        }
    });
});

// --- ROUTES ---

// --- ROUTES ---

// Social Share Open Graph Proxy
// Detects bots (WhatsApp, Facebook, Twitter) and serves meta tags without redirect
app.get('/s/:id', async (req, res) => {
    let title = 'GeoRastreador';
    let description = 'Comparte tu ubicación en tiempo real.';
    let image = 'https://cdn-icons-png.flaticon.com/512/854/854878.png';
    const redirectUrl = `/track/${req.params.id}`;

    try {
        if (models && models.Link) {
            const link = await models.Link.findByPk(req.params.id);
            if (link) {
                title = link.title || title;
                description = link.description || description;
                image = link.imageUrl || image;
            }
        }
    } catch (e) {
        console.error('Share Route Error:', e);
    }

    // Detect social media bots - they should NOT be redirected
    const userAgent = req.headers['user-agent'] || '';
    const isBot = /facebookexternalhit|Facebot|WhatsApp|TelegramBot|TwitterBot|LinkedInBot|Slackbot|Discordbot|Googlebot/i.test(userAgent);

    // Escape special characters for HTML
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const fullUrl = `${req.protocol}://${req.get('host')}/s/${req.params.id}`;

    // For bots: serve meta tags only, no redirect
    if (isBot) {
        const botHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="GeoRastreador">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/png">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${image}">
</head>
<body>
    <h1>${safeTitle}</h1>
    <p>${safeDescription}</p>
</body>
</html>`;
        return res.send(botHtml);
    }

    // For regular users: show loading page with redirect
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="GeoRastreador">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${image}">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); 
            color: white; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            text-align: center; 
            padding: 20px;
        }
        .container { max-width: 400px; }
        .icon { 
            width: 80px; 
            height: 80px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin: 0 auto 24px;
            font-size: 40px;
        }
        .loader { 
            border: 3px solid rgba(255,255,255,0.1); 
            border-top: 3px solid #38bdf8; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 20px; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        h2 { font-size: 24px; margin-bottom: 12px; font-weight: 600; }
        p { color: #94a3b8; margin-bottom: 24px; line-height: 1.6; }
        .preview-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 16px;
            margin: 20px 0;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .preview-card img {
            width: 100%;
            max-width: 300px;
            height: 160px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 12px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #38bdf8;
            color: #0f172a;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.2s;
        }
        .btn:hover { opacity: 0.9; }
    </style>
    
    <script>
        setTimeout(() => {
            window.location.href = '${redirectUrl}';
        }, 2500);
    </script>
</head>
<body>
    <div class="container">
        <div class="icon">📍</div>
        <div class="loader"></div>
        <h2>${safeTitle}</h2>
        <p>${safeDescription}</p>
        ${image ? `<div class="preview-card"><img src="${image}" alt="Preview" onerror="this.style.display='none'"></div>` : ''}
        <a href="${redirectUrl}" class="btn">
            <span>Continuar</span>
            <span>→</span>
        </a>
    </div>
</body>
</html>`;
    res.send(html);
});

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
app.get('/api/setup-db', async (req, res) => {
    try {
        if (!models || !models.sequelize) throw new Error('Database models not initialized (Check server logs)');

        await models.sequelize.query('ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;');
        res.send('Database Updated Successfully!');
    } catch (error) {
        console.error('Setup DB Error:', error);
        res.status(200).send('SETUP ERROR: ' + error.message);
    }
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

// Admin Middleware - Check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    next();
};

// --- ADMIN USER MANAGEMENT ROUTES ---

// Get all users (Admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await models.User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error obteniendo usuarios: ' + error.message });
    }
});

// Get single user (Admin only)
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await models.User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error obteniendo usuario: ' + error.message });
    }
});

// Create new user (Admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    const { email, password, role, isActive, address, city, phone } = req.body;
    
    try {
        // Check if email already exists
        const existingUser = await models.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        // Create user
        const newUser = await models.User.create({
            email,
            password, // Note: In production, hash this!
            role: role || 'user',
            isActive: isActive !== undefined ? isActive : true,
            address,
            city,
            phone
        });

        const userResponse = newUser.toJSON();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creando usuario: ' + error.message });
    }
});

// Update user (Admin only)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { email, password, role, isActive, address, city, phone, avatarUrl } = req.body;
    
    try {
        const user = await models.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await models.User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({ message: 'El email ya está registrado' });
            }
        }

        // Build updates object
        const updates = {};
        if (email !== undefined) updates.email = email;
        if (password !== undefined && password.trim() !== '') updates.password = password; // Note: In production, hash this!
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;
        if (address !== undefined) updates.address = address;
        if (city !== undefined) updates.city = city;
        if (phone !== undefined) updates.phone = phone;
        if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

        await user.update(updates);

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error actualizando usuario: ' + error.message });
    }
});

// Toggle user active status (Admin only)
app.patch('/api/admin/users/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await models.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Prevent deactivating yourself
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'No puedes desactivar tu propia cuenta' });
        }

        await user.update({ isActive: !user.isActive });

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.json({ 
            message: `Usuario ${user.isActive ? 'activado' : 'desactivado'} exitosamente`,
            user: userResponse 
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Error cambiando estado del usuario: ' + error.message });
    }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await models.User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Prevent deleting yourself
        if (user.id === req.user.id) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
        }

        await user.destroy();
        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error eliminando usuario: ' + error.message });
    }
});

// User Sessions
app.get('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const sessions = await models.Session.findAll({
            where: { active: true },
            include: [{ model: models.Link, where: { createdBy: req.user.id } }],
            order: [['timestamp', 'DESC']]
        });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear User Sessions (Clean Map)
app.delete('/api/user/sessions', authenticateToken, async (req, res) => {
    try {
        const links = await models.Link.findAll({ where: { createdBy: req.user.id } });
        const linkIds = links.map(l => l.id);

        if (linkIds.length > 0) {
            await models.Session.update({ active: false }, { where: { linkId: linkIds } });
        }
        res.json({ message: 'History cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Clear Specific Link History
app.delete('/api/links/:id/sessions', authenticateToken, async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        await models.Session.destroy({ where: { linkId: link.id } });
        res.json({ message: 'Link history cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await models.User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    const { password, avatarUrl, address, city, phone } = req.body;
    try {
        const user = await models.User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        const updates = { avatarUrl, address, city, phone };
        if (password && password.trim() !== '') {
            updates.password = password; // Note: In production, hash this!
        }

        await user.update(updates);

        const updatedUser = user.toJSON();
        delete updatedUser.password;

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Track Visit (HTTP)
app.post('/api/track', async (req, res) => {
    const { linkId, lat, lng, userAgent } = req.body;
    try {
        if (!models || !models.Session) throw new Error('Models not loaded');

        // Capture IP (Vercel/Proxy friendly)
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

        await models.Session.create({
            linkId,
            lat,
            lng,
            userAgent,
            ip,
            timestamp: new Date()
        });

        console.log(`Tracking saved for link ${linkId} from IP ${ip}`);
        res.json({ message: 'Tracking saved' });
    } catch (error) {
        console.error('Tracking Error:', error);
        res.status(500).json({ error: error.message });
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

// Database Sync Route (Fix for Vercel 500 Error on Schema Change)
// Database Sync Route (Fix for Vercel 500 Error on Schema Change)


module.exports = app;
