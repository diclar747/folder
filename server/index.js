const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = require('./app');
const { sequelize, Session } = require('./models');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP Server wrapping the Express App
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: NODE_ENV === 'production' 
            ? process.env.CLIENT_URL || true 
            : "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'] // Support both for compatibility
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-admin', () => {
        socket.join('admin-room');
        console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('update-location', async ({ linkId, lat, lng, userAgent }) => {
        try {
            if (Session) {
                // Try to find if we already have a session for this socket to update it
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
        console.log('Client disconnected:', socket.id);
        io.to('admin-room').emit('client-disconnected', socket.id);
    });
});

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');

        // Sync database models
        // Note: In production, consider using migrations instead of sync
        await sequelize.sync({ alter: NODE_ENV === 'development' });
        console.log('✅ Database models synchronized.');

        // Start server
        server.listen(PORT, () => {
            console.log(`\n🚀 Server running in ${NODE_ENV} mode`);
            console.log(`📡 Port: ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Rejection:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
    });
});

// Start the server
startServer();

module.exports = { io };
