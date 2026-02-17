const sequelize = require('../config/database');
const User = require('./User');
const Link = require('./Link');
const Session = require('./Session');

// Define associations
User.hasMany(Link, { 
    foreignKey: 'createdBy',
    as: 'links'
});

Link.belongsTo(User, { 
    foreignKey: 'createdBy',
    as: 'user'
});

Link.hasMany(Session, { 
    foreignKey: 'linkId',
    as: 'sessions'
});

Session.belongsTo(Link, { 
    foreignKey: 'linkId',
    as: 'link'
});

module.exports = {
    sequelize,
    User,
    Link,
    Session
};
