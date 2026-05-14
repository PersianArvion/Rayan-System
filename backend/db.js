// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt'); // اطمینان از نصب بودن bcrypt

const DB_PATH = path.join(__dirname, 'tech-market.db');

// ایجاد Promise برای اتصال به دیتابیس
const dbPromise = new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
            reject(err);
        } else {
            console.log('Connected to SQLite database.');
            // بعد از اتصال، جداول را می‌سازیم
            initializeDatabase(db).then(() => {
                resolve(db);
            }).catch(err => {
                reject(err);
            });
        }
    });
});

// تابع ساخت جداول و داده‌های اولیه
async function initializeDatabase(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // 1. جدول کاربران
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password_hash TEXT,
                role TEXT DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // 2. جدول دسته‌بندی‌ها
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                slug TEXT UNIQUE
            )`);

            // 3. جدول محصولات
            db.run(`CREATE TABLE IF NOT EXISTS products (
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

            // 4. جدول سفارشات
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total_price REAL,
                status TEXT DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`);

            // 5. جدول اقلام سفارش
            db.run(`CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY (order_id) REFERENCES orders(id),
                FOREIGN KEY (product_id) REFERENCES products(id)
            )`);

            // پر کردن داده‌های اولیه
            const categories = [
                { name: 'کارت گرافیک', slug: 'gpu' },
                { name: 'پردازنده', slug: 'cpu' },
                { name: 'رم', slug: 'ram' },
                { name: 'حافظه SSD', slug: 'ssd' }
            ];
            
            const stmtCat = db.prepare("INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)");
            categories.forEach(cat => stmtCat.run(cat.name, cat.slug));
            stmtCat.finalize();

            // اضافه کردن کاربر ادمین پیش‌فرض
            const adminPassword = 'admin123'; // رمز پیش‌فرض برای ادمین
            bcrypt.hash(adminPassword, 10, (err, hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return;
                }
                
                const adminEmail = 'admin@techmarket.com';
                const adminUsername = 'admin';

                db.run("SELECT * FROM users WHERE email = ?", [adminEmail], (err, row) => {
                    if (!row) {
                        db.run("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)", 
                            [adminUsername, adminEmail, hash, 'admin'], (err) => {
                                if (err) console.error('Error creating admin:', err);
                                else console.log('Admin user created/verified.');
                                
                                // ادامه کارها بعد از ایجاد ادمین
                                fillProducts(db);
                            });
                    } else {
                        // اگر ادمین وجود داشت، فقط محصولات را پر کن
                        fillProducts(db);
                    }
                });
            });
        });
    });
}

function fillProducts(db) {
    db.all("SELECT id, slug FROM categories", (err, cats) => {
        if (err) return console.error(err.message);
        
        const catMap = {};
        cats.forEach(c => catMap[c.slug] = c.id);
        
        const products = [
            { name: 'NVIDIA RTX 4090', price: 89500000, oldPrice: 99000000, catSlug: 'gpu', img: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80' },
            { name: 'Intel i9-13900K', price: 28500000, oldPrice: 32000000, catSlug: 'cpu', img: 'https://images.unsplash.com/photo-1555617117-08ccfc78e9ea?w=400&q=80' },
            { name: 'Corsair Vengeance 32GB', price: 8900000, oldPrice: 10500000, catSlug: 'ram', img: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80' },
            { name: 'Samsung 990 Pro 2TB', price: 12500000, oldPrice: 14000000, catSlug: 'ssd', img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80' }
        ];

        const stmtProd = db.prepare("INSERT INTO products (name, price, old_price, category_id, image_url) VALUES (?, ?, ?, ?, ?)");
        products.forEach(p => {
            const catId = catMap[p.catSlug] || 1;
            stmtProd.run(p.name, p.price, p.oldPrice, catId, p.img);
        });
        stmtProd.finalize();
        console.log('Sample products added.');
    });
}

module.exports = dbPromise;