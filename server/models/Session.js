const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    linkId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    socketId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lat: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    lng: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Session;
