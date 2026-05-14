const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'my_secret_key_change_in_production';

// Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        // در اینجا می‌توان بررسی کرد که آیا کاربر admin است یا خیر
        if (user.role !== 'admin') return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// دریافت تمام محصولات (برای ادمین)
router.get('/products', authenticateToken, (req, res) => {
    const sql = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        ORDER BY p.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// افزودن محصول جدید
router.post('/products', authenticateToken, (req, res) => {
    const { name, description, price, old_price, stock, category_id, image_url } = req.body;
    
    const sql = `INSERT INTO products (name, description, price, old_price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [name, description, price, old_price, stock, category_id, image_url], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product added', id: this.lastID });
    });
});

// به‌روزرسانی وضعیت سفارش
router.put('/orders/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const sql = `UPDATE orders SET status = ? WHERE id = ?`;
    db.run(sql, [status, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Status updated' });
    });
});

module.exports = router;
