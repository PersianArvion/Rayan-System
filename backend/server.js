const express = require('express');
const path = require('path');
const cors = require('cors');
const dbPromise = require('./db'); 
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// اصلاح مسیر پوشه public (یک مرحله به عقب می‌رود تا به پوشه اصلی برسد)
app.use(express.static(path.join(__dirname, '..', 'public')));

// ایمپورت روت‌ها
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api'); 
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes); 
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// روت‌های HTML با مسیر اصلاح شده
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// استارت سرور
dbPromise.then((db) => {
    console.log('Server is starting...');
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to start server due to database error:', err);
});
