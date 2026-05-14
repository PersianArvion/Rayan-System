// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const DB_PATH = path.join(__dirname, 'tech-market.db');

// Wrapper برای database برای تبدیل callback به Promise
class Database {
    constructor(db) {
        this.db = db;
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
}

// ایجاد Promise برای اتصال به دیتابیس
const dbPromise = new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            reject(err);
        } else {
            console.log('✅ Connected to SQLite database.');
            const wrappedDb = new Database(db);
            initializeDatabase(wrappedDb)
                .then(() => resolve(wrappedDb))
                .catch(err => reject(err));
        }
    });
});

// تابع ساخت جداول و داده‌های اولیه
async function initializeDatabase(db) {
    try {
        // 1. جدول کاربران
        await db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        console.log('✅ Users table ready');

        // 2. جدول دسته‌بندی‌ها
        await db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            slug TEXT UNIQUE
        )`);
        console.log('✅ Categories table ready');

        // 3. جدول محصولات
        await db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            old_price REAL,
            stock INTEGER DEFAULT 0,
            category_id INTEGER,
            image_url TEXT,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )`);
        console.log('✅ Products table ready');

        // 4. جدول سفارشات
        await db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_price REAL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
        console.log('✅ Orders table ready');

        // 5. جدول اقلام سفارش
        await db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )`);
        console.log('✅ Order items table ready');

        // پر کردن دسته‌بندی‌ها
        const categories = [
            { name: 'کارت گرافیک', slug: 'gpu' },
            { name: 'پردازنده', slug: 'cpu' },
            { name: 'رم', slug: 'ram' },
            { name: 'حافظه SSD', slug: 'ssd' }
        ];

        for (const cat of categories) {
            await db.run("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)", [cat.name, cat.slug]);
        }
        console.log('✅ Categories inserted');

        // اضافه کردن کاربر ادمین پیش‌فرض
        const adminPassword = 'admin123';
        const hash = await bcrypt.hash(adminPassword, 10);
        const adminEmail = 'admin@techmarket.com';
        const adminUsername = 'admin';

        const existingAdmin = await db.get("SELECT * FROM users WHERE email = ?", [adminEmail]);
        if (!existingAdmin) {
            await db.run(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                [adminUsername, adminEmail, hash, 'admin']
            );
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }

        // اضافه کردن محصولات نمونه
        await fillProducts(db);
        console.log('✅ Database initialized successfully');
    } catch (err) {
        console.error('❌ Database initialization error:', err);
        throw err;
    }
}

async function fillProducts(db) {
    try {
        const categories = await db.all("SELECT id, slug FROM categories");
        const catMap = {};
        categories.forEach(c => catMap[c.slug] = c.id);

        const products = [
            { name: 'NVIDIA RTX 4090', price: 89500000, oldPrice: 99000000, catSlug: 'gpu', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80' },
            { name: 'Intel i9-13900K', price: 28500000, oldPrice: 32000000, catSlug: 'cpu', img: 'https://images.unsplash.com/photo-1555617117-08ccfc78e9ea?w=400&q=80' },
            { name: 'Corsair Vengeance 32GB', price: 8900000, oldPrice: 10500000, catSlug: 'ram', img: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80' },
            { name: 'Samsung 990 Pro 2TB', price: 12500000, oldPrice: 14000000, catSlug: 'ssd', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80' }
        ];

        for (const p of products) {
            const catId = catMap[p.catSlug] || 1;
            await db.run(
                "INSERT OR IGNORE INTO products (name, price, old_price, category_id, image_url) VALUES (?, ?, ?, ?, ?)",
                [p.name, p.price, p.oldPrice, catId, p.img]
            );
        }
        console.log('✅ Sample products added');
    } catch (err) {
        console.error('❌ Error filling products:', err);
    }
}

module.exports = dbPromise;
