const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize, Session, Link, LocationHistory } = require('./models');

const PORT = process.env.PORT || 3001;

// Create HTTP Server wrapping the Express App
const server = http.createServer(app);

// Setup Socket.IO (Local only)
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all for local dev
        methods: ["GET", "POST"]
    }
});

// Track last known position per socket to detect movement server-side
const lastPositions = new Map();

// Calculate distance between two coordinates in meters (Haversine)
const getDistanceMeters = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const MOVEMENT_THRESHOLD = 10; // meters

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-admin', () => {
        socket.join('admin-room');
    });

    socket.on('update-location', async ({ linkId, lat, lng, userAgent }) => {
        try {
            if (!Session) {
                console.warn('Session model not available for socket update');
                return;
            }

            // Check if tracking is active for this link
            if (Link) {
                const link = await Link.findByPk(linkId, { attributes: ['id', 'trackingActive'] });
                if (link && link.trackingActive === false) {
                    return; // Tracking paused, don't save or broadcast
                }
            }

            // Server-side movement check (extra safety, client already filters)
            const lastPos = lastPositions.get(socket.id);
            if (lastPos) {
                const distance = getDistanceMeters(lastPos.lat, lastPos.lng, lat, lng);
                if (distance < MOVEMENT_THRESHOLD) {
                    return; // Not enough movement, skip
                }
            }
            lastPositions.set(socket.id, { lat, lng });

            const timestamp = new Date();
            const sessionData = {
                socketId: socket.id,
                linkId,
                lat,
                lng,
                userAgent,
                ip: socket.handshake.address,
                timestamp
            };

            // Find or create session for this socket
            let session = await Session.findOne({
                where: { socketId: socket.id },
                order: [['timestamp', 'DESC']]
            });

            if (session) {
                await session.update(sessionData);
                if (session.active !== false) {
                    io.to('admin-room').emit('location-updated', session);
                }
            } else {
                session = await Session.create(sessionData);
                io.to('admin-room').emit('location-updated', session);
            }

            // Save to location history for permanent route tracking
            if (LocationHistory) {
                await LocationHistory.create({
                    linkId, lat, lng, userAgent,
                    ip: socket.handshake.address,
                    timestamp
                });
            }
        } catch (error) {
            console.error('Error saving session via socket:', error);
        }
    });

    socket.on('disconnect', () => {
        lastPositions.delete(socket.id);
        io.to('admin-room').emit('client-disconnected', socket.id);
    });
});

// Sync DB and Start Server
sequelize.sync({ alter: true }).then(() => {
    server.listen(PORT, () => {
        console.log(`Local Development Server running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to sync DB on startup:', err);
});
