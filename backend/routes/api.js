/**
 * Public API Routes
 * @file backend/routes/api.js
 */

const express = require('express');
const router = express.Router();
const dbPromise = require('../db');
const { MESSAGES } = require('../config/constants');

/**
 * GET /api/products
 * Fetch all active products
 */
router.get('/products', async (req, res) => {
    try {
        const db = await dbPromise;

        const rows = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = 1
            ORDER BY p.id DESC
        `);

        console.log(`✅ Fetched ${rows.length} products`);

        res.json({
            error: false,
            data: rows,
            count: rows.length
        });
    } catch (err) {
        console.error('❌ Error fetching products:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.PRODUCT.FETCH_ERROR 
        });
    }
});

/**
 * GET /api/products/:id
 * Fetch single product by ID
 */
router.get('/products/:id', async (req, res) => {
    try {
        const db = await dbPromise;

        const product = await db.get(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? AND p.is_active = 1
        `, [req.params.id]);

        if (!product) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.PRODUCT.NOT_FOUND 
            });
        }

        res.json({
            error: false,
            data: product
        });
    } catch (err) {
        console.error('❌ Error fetching product:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.PRODUCT.FETCH_ERROR 
        });
    }
});

/**
 * GET /api/search
 * Search products by query
 */
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';

        if (!query || query.length < 2) {
            return res.status(400).json({ 
                error: true,
                message: 'حداقل 2 کاراکتر برای جستجو لازم است' 
            });
        }

        const db = await dbPromise;
        const results = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.is_active = 1
            LIMIT 20
        `, [`%${query}%`, `%${query}%`]);

        console.log(`✅ Search found ${results.length} results for: "${query}"`);

        res.json({
            error: false,
            data: results,
            count: results.length
        });
    } catch (err) {
        console.error('❌ Search error:', err);
        res.status(500).json({ 
            error: true,
            message: 'خطا در جستجو' 
        });
    }
});

/**
 * GET /api/categories
 * Fetch all categories
 */
router.get('/categories', async (req, res) => {
    try {
        const db = await dbPromise;

        const categories = await db.all('SELECT * FROM categories ORDER BY name');

        res.json({
            error: false,
            data: categories,
            count: categories.length
        });
    } catch (err) {
        console.error('❌ Error fetching categories:', err);
        res.status(500).json({ 
            error: true,
            message: 'خطا در دریافت دسته‌بندی‌ها' 
        });
    }
});

module.exports = router;
