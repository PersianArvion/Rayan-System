const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const JWT_SECRET = 'my_secret_key_change_in_production'; // در پروژه واقعی از متغیر محیطی استفاده کنید
// ثبت نام
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // بررسی تکراری نبودن
        const checkUser = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
        if (checkUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        // هش کردن رمز عبور
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        // درج در دیتابیس
        const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
        db.run(sql, [username, email, password_hash], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// ورود
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });
        // تولید توکن
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    });
});
module.exports = router;