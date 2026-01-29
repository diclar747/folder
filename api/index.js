const app = require('../server/app');
const { sequelize, User } = require('../server/models');

module.exports = async (req, res) => {
    try {
        // CRITICAL FIX: Force Database Synchronization on every request in Vercel
        // This ensures table "Users", etc., exists before handling the request.
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });

        // AUTO-SEED: Ensure Admin/User Exists
        // This fixes the "Credentials incorrect" error on empty production DBs
        try {
            const adminCount = await User.count({ where: { email: 'admin@admin' } });
            if (adminCount === 0) {
                console.log('SEEDING: Creating default admin user...');
                await User.bulkCreate([
                    {
                        email: 'admin@admin',
                        password: '1234567',
                        role: 'admin',
                        isActive: true
                    },
                    {
                        email: 'user@user.com',
                        password: '1234567',
                        role: 'user',
                        isActive: true
                    }
                ]);
            }
        } catch (seedError) {
            console.error('SEEDING ERROR (Non-fatal):', seedError);
            // Continue anyway, maybe they exist but count failed for some reason
        }

        // Pass request to Express
        app(req, res);
    } catch (err) {
        console.error('VERCEL CRITICAL ERROR:', err);
        res.status(500).json({
            error: 'CRITICAL_BOOT_FAILURE',
            message: 'El sistema falló al sincronizar o sembrar la base de datos.',
            details: err.message,
            stack: err.stack
        });
    }
};
