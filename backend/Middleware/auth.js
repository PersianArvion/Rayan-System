const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// میدلور احراز هویت برای کاربران عادی
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'توکن یافت نشد' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('[AUTH ERROR]', err.message);
            return res.status(403).json({ error: 'توکن نامعتبر است' });
        }
        req.user = user;
        next();
    });
};

// میدلور احراز هویت برای ادمین
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'توکن یافت نشد' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'توکن نامعتبر است' });
        }
        
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'تنها ادمین‌ها می‌توانند دسترسی داشته باشند' });
        }
        
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
    JWT_SECRET
};
