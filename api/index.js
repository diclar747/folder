const app = require('../server/app');

module.exports = (req, res) => {
    // Vercel Serverless Function: Pass request to Express
    // We removed the automatic 'sequelize.sync' to prevent timeouts (504) and locking errors (500).
    return app(req, res);
};
