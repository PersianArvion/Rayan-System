/**
 * User Routes
 * @file backend/routes/user.js
 */

const express = require('express');
const router = express.Router();
const dbPromise = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { MESSAGES } = require('../config/constants');

/**
 * POST /api/user/order
 * Create new order
 */
router.post('/order', authenticateToken, async (req, res) => {
    try {
        const { items, total } = req.body;
        const userId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ 
                error: true,
                message: MESSAGES.ORDER.NO_ITEMS 
            });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ 
                error: true,
                message: MESSAGES.ORDER.INVALID_TOTAL 
            });
        }

        const db = await dbPromise;

        // Create order
        const orderResult = await db.run(
            "INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)",
            [userId, total, 'pending']
        );

        // Add order items
        for (const item of items) {
            await db.run(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderResult.id, item.productId, item.quantity, item.price]
            );
        }

        console.log(`✅ Order created: ID ${orderResult.id} for user ${userId}`);

        res.status(201).json({
            error: false,
            message: MESSAGES.ORDER.CREATED,
            orderId: orderResult.id,
            totalPrice: total
        });
    } catch (err) {
        console.error('❌ Order creation error:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * GET /api/user/orders
 * Fetch user orders
 */
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await dbPromise;

        const orders = await db.all(`
            SELECT o.*, u.username, u.email
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            WHERE o.user_id = ? 
            ORDER BY o.created_at DESC
        `, [userId]);

        // Fetch items for each order
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const items = await db.all(`
                SELECT oi.*, p.name as product_name 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `, [order.id]);
            
            return { ...order, items };
        }));

        res.json({
            error: false,
            data: ordersWithItems,
            count: ordersWithItems.length
        });
    } catch (err) {
        console.error('❌ Error fetching orders:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * GET /api/user/orders/:id
 * Fetch single order
 */
router.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const orderId = req.params.id;
        const db = await dbPromise;

        const order = await db.get(
            "SELECT * FROM orders WHERE id = ? AND user_id = ?",
            [orderId, userId]
        );

        if (!order) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.ORDER.NOT_FOUND 
            });
        }

        const items = await db.all(`
            SELECT oi.*, p.name as product_name, p.image_url
            FROM order_items oi 
            JOIN products p ON oi.product_id = p.id 
            WHERE oi.order_id = ?
        `, [order.id]);

        res.json({
            error: false,
            data: { ...order, items }
        });
    } catch (err) {
        console.error('❌ Error fetching order:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * GET /api/user/profile
 * Fetch user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const db = await dbPromise;

        const user = await db.get(
            "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
            [userId]
        );

        if (!user) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.AUTH.UNAUTHORIZED 
            });
        }

        const orderCount = await db.get(
            "SELECT COUNT(*) as count FROM orders WHERE user_id = ?",
            [userId]
        );

        res.json({
            error: false,
            data: {
                ...user,
                totalOrders: orderCount.count
            }
        });
    } catch (err) {
        console.error('❌ Error fetching profile:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

module.exports = router;
