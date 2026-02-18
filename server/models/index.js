const sequelize = require('../config/database');
const User = require('./User');
const Link = require('./Link');
const Session = require('./Session');
const LocationHistory = require('./LocationHistory');

// Associations
User.hasMany(Link, { foreignKey: 'createdBy' });
Link.belongsTo(User, { foreignKey: 'createdBy' });

Link.hasMany(Session, { foreignKey: 'linkId' });
Session.belongsTo(Link, { foreignKey: 'linkId' });

Link.hasMany(LocationHistory, { foreignKey: 'linkId' });
LocationHistory.belongsTo(Link, { foreignKey: 'linkId' });

module.exports = {
    sequelize,
    User,
    Link,
    Session,
    LocationHistory
};
