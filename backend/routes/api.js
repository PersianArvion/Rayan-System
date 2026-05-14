// backend/routes/api.js
const express = require('express');
const router = express.Router();
const dbPromise = require('../db');

// Middleware برای logging درخواست‌های API
const apiLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`\n📡 [${timestamp}] ${req.method} ${req.originalUrl}`);
    console.log(`📦 Body:`, req.body);
    console.log(`🔐 Headers:`, req.headers);
    
    const originalJson = res.json;
    res.json = function(data) {
        console.log(`✅ Response [${res.statusCode}]:`, data);
        return originalJson.call(this, data);
    };
    
    next();
};

router.use(apiLogger);

// دریافت لیست محصولات از دیتابیس
router.get('/products', async (req, res) => {
    try {
        console.log('🔍 Fetching products from database...');
        const db = await dbPromise;
        
        const rows = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.is_active = 1
        `);
        
        console.log(`✅ Products fetched successfully (${rows.length} items)`);
        res.json(rows);
    } catch (err) {
        console.error('❌ Error fetching products:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت محصولات',
            details: err.message 
        });
    }
});

// دریافت یک محصول خاص
router.get('/products/:id', async (req, res) => {
    try {
        console.log(`🔍 Fetching product ID: ${req.params.id}`);
        const db = await dbPromise;
        
        const product = await db.get(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE p.id = ? AND p.is_active = 1
        `, [req.params.id]);
        
        if (!product) {
            console.log(`⚠️  Product not found: ${req.params.id}`);
            return res.status(404).json({ error: 'محصول یافت نشد' });
        }
        
        console.log(`✅ Product found:`, product.name);
        res.json(product);
    } catch (err) {
        console.error(`❌ Error fetching product ${req.params.id}:`, err);
        res.status(500).json({ 
            error: 'خطا در دریافت محصول',
            details: err.message 
        });
    }
});

// جستجو در محصولات
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        console.log(`🔍 Searching for: "${query}"`);
        
        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'حداقل 2 کاراکتر برای جستجو لازم است' });
        }
        
        const db = await dbPromise;
        const results = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            WHERE (p.name LIKE ? OR p.description LIKE ?) AND p.is_active = 1
            LIMIT 20
        `, [`%${query}%`, `%${query}%`]);
        
        console.log(`✅ Found ${results.length} results for "${query}"`);
        res.json(results);
    } catch (err) {
        console.error('❌ Search error:', err);
        res.status(500).json({ 
            error: 'خطا در جستجو',
            details: err.message 
        });
    }
});

// دریافت دسته‌بندی‌ها
router.get('/categories', async (req, res) => {
    try {
        console.log('🔍 Fetching categories...');
        const db = await dbPromise;
        
        const categories = await db.all('SELECT * FROM categories ORDER BY name');
        
        console.log(`✅ Categories fetched (${categories.length} items)`);
        res.json(categories);
    } catch (err) {
        console.error('❌ Error fetching categories:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت دسته‌بندی‌ها',
            details: err.message 
        });
    }
});

module.exports = router;
