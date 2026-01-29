const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Link = sequelize.define('Link', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
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
        type: DataTypes.STRING,
        allowNull: false
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false
    },
    buttonText: {
        type: DataTypes.STRING,
        defaultValue: 'Más información'
    }
}, {
    tableName: 'Links',
    timestamps: true
});

module.exports = Link;
