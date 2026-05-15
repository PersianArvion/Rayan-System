/**
 * Request Logging Middleware
 * @file backend/middleware/requestLogger.js
 */

const requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method.toUpperCase();
    const url = req.originalUrl;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏰ [${timestamp}]`);
    console.log(`📡 ${method} ${url}`);

    if (Object.keys(req.body).length > 0) {
        console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
    }

    const start = Date.now();
    const originalJson = res.json;

    res.json = function(data) {
        const duration = Date.now() - start;
        console.log(`✅ Status: ${res.statusCode} | Duration: ${duration}ms`);
        if (res.statusCode >= 400) {
            console.log(`❌ Response:`, JSON.stringify(data, null, 2));
        }
        console.log(`${'='.repeat(60)}`);
        return originalJson.call(this, data);
    };

    next();
};

module.exports = requestLogger;
