const app = require('../server/app');
const { sequelize } = require('../server/models');

module.exports = async (req, res) => {
    try {
        // CRITICAL FIX: Force Database Synchronization on every request in Vercel
        // This ensures table "Users", etc., exists before handling the request.
        // "Reventando el sistema" as requested to ensure it works.
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        // Pass request to Express
        app(req, res);
    } catch (err) {
        console.error('VERCEL CRITICAL ERROR:', err);
        res.status(500).json({
            error: 'CRITICAL_BOOT_FAILURE',
            message: 'El sistema falló al sincronizar la base de datos.',
            details: err.message,
            stack: err.stack
        });
    }
};
