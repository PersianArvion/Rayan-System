const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dbPromise = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_change_in_production';

// Middleware برای بررسی توکن
async function authenticateToken(req, res, next) {
    const timestamp = new Date().toISOString();
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    console.log(`\n👤 [${timestamp}] USER AUTH CHECK`);
    console.log(`🔐 Token present: ${!!token}`);
    
    if (!token) {
        console.log('❌ No token provided - Unauthorized');
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`❌ Token invalid: ${err.message}`);
            return res.sendStatus(403);
        }
        console.log(`✅ Token verified for user ${user.id}`);
        req.user = user;
        next();
    });
}

// ایجاد سفارش جدید
router.post('/order', authenticateToken, async (req, res) => {
    try {
        const { items, total } = req.body;
        
        console.log(`\n📦 Creating order for user ${req.user.id}`);
        console.log(`📋 Items:`, items);
        console.log(`💰 Total: ${total}`);

        if (!items || items.length === 0) {
            console.log('⚠️  No items provided');
            return res.status(400).json({ message: 'لطفاً محصول انتخاب کنید' });
        }

        if (!total || total <= 0) {
            console.log('⚠️  Invalid total');
            return res.status(400).json({ message: 'مبلغ نامعتبر است' });
        }

        const db = await dbPromise;

        const result = await db.run(
            "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
            [req.user.id, total, 'pending']
        );

        const orderId = result.id;
        console.log(`✅ Order created (ID: ${orderId})`);

        // درج اقلام
        for (const item of items) {
            console.log(`  📌 Adding item: ${item.name} (Product ID: ${item.productId}, Qty: ${item.quantity})`);
            
            await db.run(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.productId, item.quantity, item.price]
            );
        }

        console.log(`✅ All items added to order ${orderId}`);
        
        res.status(201).json({
            message: 'سفارش با موفقیت ثبت شد',
            orderId,
            totalPrice: total
        });
    } catch (err) {
        console.error('❌ Order creation error:', err);
        res.status(500).json({ 
            error: 'خطا در ایجاد سفارش',
            details: err.message 
        });
    }
});

// دریافت سفارشات کاربر
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        console.log(`\n📦 Fetching orders for user ${req.user.id}`);
        const db = await dbPromise;

        const orders = await db.all(`
            SELECT o.*, u.username, u.email
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `, [req.user.id]);

        console.log(`✅ Found ${orders.length} orders`);

        // دریافت جزئیات هر سفارش
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await db.all(`
                SELECT oi.*, p.name as product_name 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
            
            console.log(`  📋 Order ${order.id}: ${items.length} items, Status: ${order.status}`);
            return { ...order, items };
        }));

        res.json({
            message: 'سفارشات دریافت شد',
            count: ordersWithItems.length,
            orders: ordersWithItems
        });
    } catch (err) {
        console.error('❌ Error fetching orders:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت سفارشات',
            details: err.message 
        });
    }
});

// دریافت یک سفارش خاص
router.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`\n📦 Fetching order ${req.params.id} for user ${req.user.id}`);
        const db = await dbPromise;

        const order = await db.get(`
            SELECT * FROM orders WHERE id = ? AND user_id = ?
        `, [req.params.id, req.user.id]);

        if (!order) {
            console.log(`⚠️  Order not found: ${req.params.id}`);
            return res.status(404).json({ error: 'سفارش یافت نشد' });
        }

        const items = await db.all(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `, [order.id]);

        console.log(`✅ Order ${order.id} retrieved with ${items.length} items`);

        res.json({
            ...order,
            items
        });
    } catch (err) {
        console.error(`❌ Error fetching order ${req.params.id}:`, err);
        res.status(500).json({ 
            error: 'خطا در دریافت سفارش',
            details: err.message 
        });
    }
});

// دریافت اطلاعات کاربر
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        console.log(`\n👤 Fetching profile for user ${req.user.id}`);
        const db = await dbPromise;

        const user = await db.get(`
            SELECT id, username, email, role, created_at FROM users WHERE id = ?
        `, [req.user.id]);

        if (!user) {
            console.log(`⚠️  User not found: ${req.user.id}`);
            return res.status(404).json({ error: 'کاربر یافت نشد' });
        }

        const orderCount = await db.get(`
            SELECT COUNT(*) as count FROM orders WHERE user_id = ?
        `, [req.user.id]);

        console.log(`✅ Profile retrieved - Orders: ${orderCount.count}`);

        res.json({
            ...user,
            totalOrders: orderCount.count
        });
    } catch (err) {
        console.error('❌ Error fetching profile:', err);
        res.status(500).json({ 
            error: 'خطا در دریافت اطلاعات کاربر',
            details: err.message 
        });
    }
});

module.exports = router;
