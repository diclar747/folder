const { Sequelize } = require('sequelize');

// Use the appropriate database URL for Vercel deployment
// Force Neon DB to avoid Vercel Postgres shadowing
const databaseUrl = 'postgresql://neondb_owner:npg_zaGO5Fmeokp9@ep-jolly-shape-ah45awdh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: require('pg'), // Required for Vercel/Next.js/Serverless
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false, // Disable logging in production, enable for debugging
    pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
