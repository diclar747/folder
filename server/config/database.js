const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MySQL Configuration
// For local development, use .env file
// For production hosting, set environment variables
const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'ubicar_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialectOptions: {
        // For hosting providers that require SSL (uncomment if needed):
        // ssl: {
        //     require: true,
        //     rejectUnauthorized: false
        // }
    }
};

// Alternative: Use DATABASE_URL if provided (some hosting providers use this format)
let sequelize;

if (process.env.DATABASE_URL) {
    // Parse DATABASE_URL format: mysql://user:pass@host:port/database
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // Use individual config parameters
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            port: config.port,
            dialect: config.dialect,
            logging: config.logging,
            pool: config.pool,
            dialectOptions: config.dialectOptions
        }
    );
}

// Test connection function
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to MySQL database:', error.message);
        return false;
    }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;
