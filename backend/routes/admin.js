const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbPromise = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_change_in_production';

// Middleware برای بررسی دسترسی ادمین
async function authenticateAdmin(req, res, next) {
    const timestamp = new Date().toISOString();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log(`\n👮 [${timestamp}] ADMIN AUTH CHECK`);
    console.log(`🔐 Token present: ${!!token}`);

    if (!token) {
        console.log('❌ No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`❌ Invalid token: ${err.message}`);
            return res.sendStatus(403);
        }

        console.log(`✅ Token verified - User: ${user.id}, Role: ${user.role}`);

        if (user.role !== 'admin') {
            console.log(`❌ Access denied - User is not admin`);
            return res.status(403).json({ error: 'دسترسی رد شد - تنها ادمین‌ها می‌توانند این عملیات را انجام دهند' });
        }

        console.log(`✅ Admin access granted for user ${user.id}`);
        req.user = user;
        next();
    });
}

// دریافت تمام محصولات (برای ادمین)
router.get('/products', authenticateAdmin, async (req, res) => {
    try {
        console.log(`\n📊 Admin fetching all products`);
        const db = await dbPromise;

        const products = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.id DESC
        `);

        console.log(`✅ Retrieved ${products.length} products`);
        res.json({
            message: 'لیست محصولات',
            count: products.length,
            products
        });
    } catch (err) {
        console.error('❌ Error fetching products:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت محصولات',
            details: err.message 
        });
    }
});

// افزودن محصول جدید
router.post('/products', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, old_price, stock, category_id, image_url } = req.body;

        console.log(`\n➕ Admin adding new product`);
        console.log(`  📝 Name: ${name}`);
        console.log(`  💰 Price: ${price}`);
        console.log(`  📦 Stock: ${stock}`);
        console.log(`  🏷️  Category: ${category_id}`);

        if (!name || !price) {
            console.log('⚠️  Missing required fields');
            return res.status(400).json({ message: 'نام و قیمت محصول ضروری هستند' });
        }

        const db = await dbPromise;

        const result = await db.run(`
            INSERT INTO products (name, description, price, old_price, stock, category_id, image_url, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, description || '', price, old_price || null, stock || 0, category_id || 1, image_url || '']);

        console.log(`✅ Product added successfully (ID: ${result.id})`);

        res.status(201).json({
            message: 'محصول با موفقیت اضافه شد',
            productId: result.id,
            product: { id: result.id, name, price }
        });
    } catch (err) {
        console.error('❌ Error adding product:', err);
        res.status(500).json({ 
            error: 'خطا در اضافه کردن محصول',
            details: err.message 
        });
    }
});

// به‌روزرسانی محصول
router.put('/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, old_price, stock, category_id, is_active } = req.body;

        console.log(`\n✏️  Admin updating product ${req.params.id}`);
        console.log(`  📝 Updates:`, { name, price, stock });

        if (!name || !price) {
            console.log('⚠️  Missing required fields');
            return res.status(400).json({ message: 'نام و قیمت ضروری هستند' });
        }

        const db = await dbPromise;

        const result = await db.run(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, old_price = ?, stock = ?, category_id = ?, is_active = ?
            WHERE id = ?
        `, [name, description || '', price, old_price || null, stock || 0, category_id || 1, is_active !== false ? 1 : 0, req.params.id]);

        if (result.changes === 0) {
            console.log(`⚠️  Product not found: ${req.params.id}`);
            return res.status(404).json({ message: 'محصول یافت نشد' });
        }

        console.log(`✅ Product ${req.params.id} updated successfully`);

        res.json({
            message: 'محصول با موفقیت به‌روز رسانی شد',
            productId: req.params.id
        });
    } catch (err) {
        console.error(`❌ Error updating product ${req.params.id}:`, err);
        res.status(500).json({ 
            error: 'خطا در به‌روزرسانی محصول',
            details: err.message 
        });
    }
});

// حذف محصول (soft delete)
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log(`\n❌ Admin deleting product ${req.params.id}`);
        const db = await dbPromise;

        const result = await db.run(`
            UPDATE products SET is_active = 0 WHERE id = ?
        `, [req.params.id]);

        if (result.changes === 0) {
            console.log(`⚠️  Product not found: ${req.params.id}`);
            return res.status(404).json({ message: 'محصول یافت نشد' });
        }

        console.log(`✅ Product ${req.params.id} deactivated`);

        res.json({
            message: 'محصول با موفقیت حذف شد',
            productId: req.params.id
        });
    } catch (err) {
        console.error(`❌ Error deleting product ${req.params.id}:`, err);
        res.status(500).json({ 
            error: 'خطا در حذف محصول',
            details: err.message 
        });
    }
});

// دریافت تمام سفارشات
router.get('/orders', authenticateAdmin, async (req, res) => {
    try {
        console.log(`\n📦 Admin fetching all orders`);
        const db = await dbPromise;

        const orders = await db.all(`
            SELECT o.*, u.username, u.email
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);

        console.log(`✅ Retrieved ${orders.length} orders`);

        res.json({
            message: 'لیست تمام سفارشات',
            count: orders.length,
            orders
        });
    } catch (err) {
        console.error('❌ Error fetching orders:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت سفارشات',
            details: err.message 
        });
    }
});

// به‌روزرسانی وضعیت سفارش
router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        console.log(`\n🔄 Admin updating order ${req.params.id} status to: ${status}`);

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            console.log(`⚠️  Invalid status: ${status}`);
            return res.status(400).json({ message: 'وضعیت نامعتبر است' });
        }

        const db = await dbPromise;

        const result = await db.run(
            `UPDATE orders SET status = ? WHERE id = ?`,
            [status, req.params.id]
        );

        if (result.changes === 0) {
            console.log(`⚠️  Order not found: ${req.params.id}`);
            return res.status(404).json({ message: 'سفارش یافت نشد' });
        }

        console.log(`✅ Order ${req.params.id} status updated to ${status}`);

        res.json({
            message: 'وضعیت سفارش با موفقیت به‌روز رسانی شد',
            orderId: req.params.id,
            newStatus: status
        });
    } catch (err) {
        console.error(`❌ Error updating order ${req.params.id}:`, err);
        res.status(500).json({ 
            error: 'خطا در به‌روزرسانی وضعیت',
            details: err.message 
        });
    }
});

// دریافت آمار کلی
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        console.log(`\n📊 Admin fetching statistics`);
        const db = await dbPromise;

        const userCount = await db.get(`SELECT COUNT(*) as count FROM users`);
        const productCount = await db.get(`SELECT COUNT(*) as count FROM products WHERE is_active = 1`);
        const orderCount = await db.get(`SELECT COUNT(*) as count FROM orders`);
        const totalRevenue = await db.get(`SELECT SUM(total_price) as total FROM orders WHERE status = 'delivered'`);

        console.log(`✅ Stats retrieved`);

        res.json({
            stats: {
                users: userCount.count,
                products: productCount.count,
                orders: orderCount.count,
                revenue: totalRevenue.total || 0
            }
        });
    } catch (err) {
        console.error('❌ Error fetching stats:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت آمار',
            details: err.message 
        });
    }
});

module.exports = router;
