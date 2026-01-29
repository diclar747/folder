try {
    const app = require('../server/index');
    module.exports = app;
} catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'BOOTSTRAP_FAILURE',
            message: err.message,
            stack: err.stack,
            hint: 'This error occurred before the Express app could load. Check for missing dependencies or syntax errors in server/index.js.'
        });
    };
}
