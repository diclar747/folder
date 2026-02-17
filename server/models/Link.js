const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Link = sequelize.define('Link', {
    id: {
        type: DataTypes.STRING(50),
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    destinationUrl: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    buttonText: {
        type: DataTypes.STRING(100),
        defaultValue: 'Más información'
    }
}, {
    timestamps: true,
    tableName: 'links'
});

module.exports = Link;
