try {
    const app = require('../server/app');
    module.exports = app;
} catch (err) {
    console.error('BOOTSTRAP ERROR:', err);
    module.exports = (req, res) => {
        res.status(500).json({
            error: 'BOOTSTRAP_FAILURE',
            message: err.message,
            stack: err.stack,
            hint: 'Fallo crítico al cargar server/app.js. Revisa dependencias.'
        });
    };
}
