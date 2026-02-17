const { sequelize, User } = require('./models');

async function seed() {
    try {
        // Sync database
        await sequelize.sync({ alter: true });
        console.log('✅ Database synced successfully');

        // Seed Admin User
        const adminEmail = 'admin@admin.com';
        const admin = await User.findOne({ where: { email: adminEmail } });
        
        if (!admin) {
            await User.create({
                email: adminEmail,
                password: '1234567',
                role: 'admin',
                isActive: true
            });
            console.log('✅ Admin user created: admin@admin.com / 1234567');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Seed Standard User
        const userEmail = 'user@user.com';
        const userUser = await User.findOne({ where: { email: userEmail } });
        
        if (!userUser) {
            await User.create({
                email: userEmail,
                password: '1234567',
                role: 'user',
                isActive: true
            });
            console.log('✅ Standard user created: user@user.com / 1234567');
        } else {
            console.log('ℹ️  Standard user already exists');
        }

        console.log('\n🎉 Seeding completed successfully!');
        console.log('\nLogin credentials:');
        console.log('  Admin:    admin@admin.com / 1234567');
        console.log('  Usuario:  user@user.com / 1234567');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
