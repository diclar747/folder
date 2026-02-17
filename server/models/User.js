const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    avatarUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'users'
});

module.exports = User;
