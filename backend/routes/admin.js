/**
 * Admin Routes
 * @file backend/routes/admin.js
 */

const express = require('express');
const router = express.Router();
const dbPromise = require('../db');
const { authenticateAdmin } = require('../middleware/auth');
const { validateProductData } = require('../utils/validators');
const { MESSAGES, ORDER_STATUS } = require('../config/constants');

/**
 * GET /api/admin/products
 * Fetch all products (admin view)
 */
router.get('/products', authenticateAdmin, async (req, res) => {
    try {
        const db = await dbPromise;

        const products = await db.all(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id 
            ORDER BY p.id DESC
        `);

        res.json({
            error: false,
            data: products,
            count: products.length
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
 * POST /api/admin/products
 * Create new product
 */
router.post('/products', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, old_price, stock, category_id, image_url } = req.body;

        const validation = validateProductData({ name, price, old_price });
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: true,
                message: validation.errors.join(', ') 
            });
        }

        const db = await dbPromise;

        const result = await db.run(`
            INSERT INTO products (name, description, price, old_price, stock, category_id, image_url, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [name, description || '', price, old_price || null, stock || 0, category_id || 1, image_url || '']);

        console.log(`✅ Product created: ID ${result.id} - ${name}`);

        res.status(201).json({
            error: false,
            message: MESSAGES.PRODUCT.ADD_SUCCESS,
            productId: result.id
        });
    } catch (err) {
        console.error('❌ Error adding product:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * PUT /api/admin/products/:id
 * Update product
 */
router.put('/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const { name, description, price, old_price, stock, category_id, is_active } = req.body;

        const validation = validateProductData({ name, price, old_price });
        if (!validation.isValid) {
            return res.status(400).json({ 
                error: true,
                message: validation.errors.join(', ') 
            });
        }

        const db = await dbPromise;

        const result = await db.run(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, old_price = ?, stock = ?, category_id = ?, is_active = ?
            WHERE id = ?
        `, [name, description || '', price, old_price || null, stock || 0, category_id || 1, is_active !== false ? 1 : 0, req.params.id]);

        if (result.changes === 0) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.PRODUCT.NOT_FOUND 
            });
        }

        console.log(`✅ Product updated: ID ${req.params.id}`);

        res.json({
            error: false,
            message: MESSAGES.PRODUCT.UPDATE_SUCCESS,
            productId: req.params.id
        });
    } catch (err) {
        console.error('❌ Error updating product:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * DELETE /api/admin/products/:id
 * Soft delete product
 */
router.delete('/products/:id', authenticateAdmin, async (req, res) => {
    try {
        const db = await dbPromise;

        const result = await db.run(
            "UPDATE products SET is_active = 0 WHERE id = ?",
            [req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.PRODUCT.NOT_FOUND 
            });
        }

        console.log(`✅ Product deactivated: ID ${req.params.id}`);

        res.json({
            error: false,
            message: MESSAGES.PRODUCT.DELETE_SUCCESS,
            productId: req.params.id
        });
    } catch (err) {
        console.error('❌ Error deleting product:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * GET /api/admin/orders
 * Fetch all orders
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
    try {
        const db = await dbPromise;

        const orders = await db.all(`
            SELECT o.*, u.username, u.email
            FROM orders o 
            JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);

        res.json({
            error: false,
            data: orders,
            count: orders.length
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
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!Object.values(ORDER_STATUS).includes(status)) {
            return res.status(400).json({ 
                error: true,
                message: 'وضعیت نامعتبر است' 
            });
        }

        const db = await dbPromise;

        const result = await db.run(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, req.params.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({ 
                error: true,
                message: MESSAGES.ORDER.NOT_FOUND 
            });
        }

        console.log(`✅ Order status updated: ID ${req.params.id} -> ${status}`);

        res.json({
            error: false,
            message: MESSAGES.ORDER.STATUS_UPDATED,
            orderId: req.params.id,
            newStatus: status
        });
    } catch (err) {
        console.error('❌ Error updating order:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * GET /api/admin/stats
 * Fetch statistics
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const db = await dbPromise;

        const userCount = await db.get("SELECT COUNT(*) as count FROM users");
        const productCount = await db.get("SELECT COUNT(*) as count FROM products WHERE is_active = 1");
        const orderCount = await db.get("SELECT COUNT(*) as count FROM orders");
        const totalRevenue = await db.get("SELECT SUM(total_price) as total FROM orders WHERE status = 'delivered'");

        res.json({
            error: false,
            data: {
                users: userCount.count,
                products: productCount.count,
                orders: orderCount.count,
                revenue: totalRevenue.total || 0
            }
        });
    } catch (err) {
        console.error('❌ Error fetching stats:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

module.exports = router;
