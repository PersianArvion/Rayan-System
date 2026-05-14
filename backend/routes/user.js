const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = 'my_secret_key_change_in_production';

// Middleware برای بررسی توکن
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ایجاد سفارش جدید
router.post('/order', authenticateToken, (req, res) => {
    const { items, total } = req.body; // items: [{productId, quantity, price}]

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items provided' });
    }

    db.serialize(() => {
        const stmt = db.prepare("INSERT INTO orders (user_id, total_price) VALUES (?, ?)");
        stmt.run(req.user.id, total, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const orderId = this.lastID;

            // درج اقلام
            const stmtItem = db.prepare("INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)");
            items.forEach(item => {
                stmtItem.run(orderId, item.productId, item.quantity, item.price);
            });
            stmtItem.finalize();

            stmt.finalize();
            res.status(201).json({ message: 'Order placed successfully', orderId });
        });
    });
});

// دریافت سفارشات کاربر
router.get('/orders', authenticateToken, (req, res) => {
    const sql = `
        SELECT o.*, u.username 
        FROM orders o 
        JOIN users u ON o.user_id = u.id 
        WHERE o.user_id = ? 
        ORDER BY o.created_at DESC
    `;
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // دریافت جزئیات هر سفارش
        const ordersWithItems = rows.map(order => {
            const sqlItems = `
                SELECT oi.*, p.name as product_name 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `;
            return new Promise((resolve) => {
                db.all(sqlItems, [order.id], (err, items) => {
                    resolve({ ...order, items });
                });
            });
        });

        Promise.all(ordersWithItems).then(orders => {
            res.json(orders);
        });
    });
});

module.exports = router;