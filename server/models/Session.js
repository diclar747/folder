const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    linkId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        references: {
            model: 'links',
            key: 'id'
        }
    },
    socketId: {
        type: DataTypes.STRING(100),
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
        type: DataTypes.TEXT,
        allowNull: true
    },
    ip: {
        type: DataTypes.STRING(45),
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: false,
    tableName: 'sessions'
});

module.exports = Session;
