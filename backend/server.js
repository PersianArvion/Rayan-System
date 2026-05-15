/**
 * Express Server Entry Point
 * @file backend/server.js
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const dbPromise = require('./db');

// Middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ===== STATIC FILES =====
app.use(express.static(path.join(__dirname, '..', 'public')));

// ===== API ROUTES =====
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// ===== HTML ROUTES =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    console.log(`⚠️  404 - ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: true,
        message: 'مسیر یافت نشد' 
    });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== START SERVER =====
dbPromise
    .then((db) => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 Starting Tech Market Server...');
        console.log('='.repeat(60) + '\n');

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`✅ Database: Connected`);
            console.log('\n📝 Ready to accept requests...\n');
        });
    })
    .catch((err) => {
        console.error('\n❌ Failed to start server:');
        console.error(err);
        process.exit(1);
    });

module.exports = app;
