const { Sequelize } = require('sequelize');

const databaseUrl = 'postgresql://neondb_owner:npg_zaGO5Fmeokp9@ep-jolly-shape-ah45awdh-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

module.exports = sequelize;
