const { sequelize, User } = require('./models');

async function seed() {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced');

        // Seed Admin
        const adminEmail = 'admin@admin';
        const admin = await User.findOne({ where: { email: adminEmail } });
        if (!admin) {
            await User.create({
                email: adminEmail,
                password: '1234567',
                role: 'admin'
            });
            console.log('Admin user created');
        } else {
            console.log('Admin user already exists');
        }

        // Seed Standard User
        const userEmail = 'user@user.com';
        const userUser = await User.findOne({ where: { email: userEmail } });
        if (!userUser) {
            await User.create({
                email: userEmail,
                password: '1234567',
                role: 'user'
            });
            console.log('Standard user created');
        } else {
            console.log('Standard user already exists');
        }

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
