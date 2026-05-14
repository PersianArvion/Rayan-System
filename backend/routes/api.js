// backend/routes/api.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// دریافت لیست محصولات از دیتابیس
router.get('/products', (req, res) => {
    db.all(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.is_active = 1
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;