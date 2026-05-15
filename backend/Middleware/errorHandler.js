/**
 * Global Error Handler Middleware
 * @file backend/middleware/errorHandler.js
 */

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'خطای سرویس';

    console.error('❌ Error:', {
        status,
        message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    res.status(status).json({
        error: true,
        status,
        message,
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
