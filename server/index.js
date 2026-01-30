const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { sequelize, Session } = require('./models');

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

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-admin', () => {
        socket.join('admin-room');
    });

    socket.on('update-location', async ({ linkId, lat, lng, userAgent }) => {
        try {
            if (Session) {
                // Try to find if we already have a session for this socket to update it
                // instead of creating a new one every second/move
                let session = await Session.findOne({
                    where: { socketId: socket.id },
                    order: [['timestamp', 'DESC']]
                });

                const sessionData = {
                    socketId: socket.id,
                    linkId,
                    lat,
                    lng,
                    userAgent,
                    ip: socket.handshake.address,
                    timestamp: new Date()
                };

                if (session) {
                    await session.update(sessionData);
                    // Silence updates for "Cleared" (inactive) sessions
                    if (session.active !== false) {
                        io.to('admin-room').emit('location-updated', session);
                    }
                } else {
                    session = await Session.create(sessionData);
                    io.to('admin-room').emit('location-updated', session);
                }
            } else {
                console.warn('Session model not available for socket update');
            }
        } catch (error) {
            console.error('Error saving session via socket:', error);
        }
    });

    socket.on('disconnect', () => {
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
