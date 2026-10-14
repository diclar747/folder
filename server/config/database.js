const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL. Se configura con DATABASE_URL; si no existe se usa la BD local.
// SSL se activa solo si la URL trae sslmode=require o si DB_SSL=true (hosts remotos).
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ubicar';
const useSsl = process.env.DB_SSL === 'true' || /sslmode=require/.test(databaseUrl);

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectModule: require('pg'), // Required for Vercel/Next.js/Serverless
    dialectOptions: useSsl ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    logging: false, // Disable logging in production, enable for debugging
    pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
