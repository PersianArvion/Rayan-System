const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbPromise = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_change_in_production';

// Middleware برای logging
const authLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🔐 [${timestamp}] AUTH ${req.method} ${req.originalUrl}`);
    console.log(`📧 Email/Username:`, req.body.email || req.body.username);
    next();
};

router.use(authLogger);

// ثبت نام
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log('📝 Register attempt:', { username, email });
        
        if (!username || !email || !password) {
            console.log('⚠️  Missing fields in registration');
            return res.status(400).json({ message: 'تمام فیلدها ضروری هستند' });
        }

        const db = await dbPromise;
        
        // بررسی تکراری نبودن
        const checkUser = await db.get("SELECT * FROM users WHERE email = ?", [email]);
        if (checkUser) {
            console.log(`⚠️  Email already exists: ${email}`);
            return res.status(400).json({ message: 'این ایمیل قبلاً ثبت شده است' });
        }

        const checkUsername = await db.get("SELECT * FROM users WHERE username = ?", [username]);
        if (checkUsername) {
            console.log(`⚠️  Username already exists: ${username}`);
            return res.status(400).json({ message: 'این نام کاربری قبلاً ثبت شده است' });
        }

        // هش کردن رمز عبور
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        console.log('🔐 Password hashed successfully');

        // درج در دیتابیس
        const result = await db.run(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [username, email, password_hash, 'user']
        );
        
        console.log(`✅ User registered successfully (ID: ${result.id})`);
        res.status(201).json({ 
            message: 'ثبت نام موفقیت‌آمیز بود',
            userId: result.id 
        });
    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).json({ 
            error: 'خطا در ثبت نام',
            details: err.message 
        });
    }
});

// ورود
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔍 Login attempt for:', email);
        
        if (!email || !password) {
            console.log('⚠️  Missing email or password');
            return res.status(400).json({ message: 'ایمیل و رمز عبور ضروری هستند' });
        }

        const db = await dbPromise;
        
        const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
        
        if (!user) {
            console.log(`⚠️  User not found: ${email}`);
            return res.status(400).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
        }

        console.log(`👤 User found:`, user.username);

        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            console.log(`⚠️  Invalid password for user: ${email}`);
            return res.status(400).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
        }

        console.log(`✅ Password verified for: ${user.username}`);

        // تولید توکن
        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log(`✅ JWT token generated for user ${user.id} (expires in 7 days)`);
        
        res.json({
            message: 'ورود موفقیت‌آمیز بود',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ 
            error: 'خطا در ورود',
            details: err.message 
        });
    }
});

// تأیید توکن
router.post('/verify', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        console.log('🔍 Verifying token...');
        
        if (!token) {
            console.log('⚠️  No token provided');
            return res.status(401).json({ valid: false, message: 'توکن یافت نشد' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                console.log('⚠️  Invalid token:', err.message);
                return res.status(403).json({ valid: false, message: 'توکن نامعتبر است' });
            }
            
            console.log(`✅ Token verified for user ${user.id}`);
            res.json({ valid: true, user });
        });
    } catch (err) {
        console.error('❌ Token verification error:', err);
        res.status(500).json({ 
            error: 'خطا در تأیید توکن',
            details: err.message 
        });
    }
});

module.exports = router;
