const express = require('express');
const path = require('path');
const cors = require('cors');
const dbPromise = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Request Logger
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method.toUpperCase();
    const url = req.originalUrl;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏰ [${timestamp}]`);
    console.log(`📡 ${method} ${url}`);
    
    if (Object.keys(req.body).length > 0) {
        console.log(`📦 Request Body:`, JSON.stringify(req.body, null, 2));
    }
    
    console.log(`${'='.repeat(60)}`);
    
    // Capture response time
    const start = Date.now();
    const originalJson = res.json;
    
    res.json = function(data) {
        const duration = Date.now() - start;
        console.log(`✅ Response Status: ${res.statusCode}`);
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📤 Response:`, JSON.stringify(data, null, 2));
        return originalJson.call(this, data);
    };
    
    next();
});

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

// Mount routes
console.log('🚀 Mounting routes...');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
console.log('✅ All routes mounted');

// HTML routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: 'خطای سرویس',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`⚠️  404 - Not Found: ${req.originalUrl}`);
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
dbPromise.then((db) => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Starting server...');
    console.log('='.repeat(60) + '\n');
    
    app.listen(PORT, () => {
        console.log(`\n✅ Server is running on http://localhost:${PORT}`);
        console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`✅ Database: Connected`);
        console.log('\n📝 Waiting for requests...\n');
    });
}).catch((err) => {
    console.error('\n❌ Failed to start server due to database error:');
    console.error(err);
    process.exit(1);
});
