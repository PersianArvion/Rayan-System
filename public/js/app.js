// public/js/app.js - برنامه اصلی SPA
import { ApiClient } from './api-client.js';
import { AuthManager } from './auth-manager.js';
import { UIHelpers } from './ui-helpers.js';

class App {
    constructor() {
        this.api = new ApiClient();
        this.auth = new AuthManager();
        this.ui = UIHelpers;
        this.currentPage = null;
        this.init();
    }

    async init() {
        console.log('[APP] 🚀 برنامه در حال شروع...');
        
        this.setupNavigation();
        this.setupEventListeners();
        this.renderHome();
        
        // بروزرسانی cart badge
        this.updateCartBadge();
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-categories a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page') || 'home';
                this.navigate(page);
            });
        });

        // دکمه حساب کاربری
        const accountBtn = document.querySelector('.icon-btn[title="حساب کاربری"]');
        if (accountBtn) {
            accountBtn.onclick = () => {
                if (this.auth.isAdmin()) this.navigate('admin-dashboard');
                else if (this.auth.isAuthenticated()) this.navigate('user-dashboard');
                else this.navigate('login');
            };
        }

        // دکمه سبد خرید
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.onclick = () => this.navigate('cart');
        }

        // دکمه علاقه‌مندی‌ها
        const wishlistBtn = document.querySelector('.icon-btn[title="علاقه‌مندی‌ها"]');
        if (wishlistBtn) {
            wishlistBtn.onclick = () => this.navigate('wishlist');
        }
    }

    setupEventListeners() {
        // جستجو
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.navigate('products', { search: e.target.value });
            });
        }
    }

    async navigate(page, options = {}) {
        console.log(`[NAV] صفحه: ${page}`, options);
        
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) {
            console.error('[ERROR] عنصر mainContent یافت نشد');
            return;
        }

        this.currentPage = page;

        switch (page) {
            case 'home':
                await this.renderHome();
                break;
            case 'products':
                await this.renderProducts(options);
                break;
            case 'cart':
                this.renderCart();
                break;
            case 'wishlist':
                this.renderWishlist();
                break;
            case 'login':
                this.renderLogin();
                break;
            case 'register':
                this.renderRegister();
                break;
            case 'user-dashboard':
                if (!this.auth.isAuthenticated()) {
                    this.ui.showToast('ابتدا وارد شوید', 'error');
                    this.navigate('login');
                    return;
                }
                await this.renderUserDashboard();
                break;
            case 'admin-dashboard':
                if (!this.auth.isAdmin()) {
                    this.ui.showToast('شما اجازه دسترسی ندارید', 'error');
                    this.navigate('home');
                    return;
                }
                await this.renderAdminDashboard();
                break;
            default:
                this.renderHome();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async renderHome() {
        const content = await this.api.fetchProducts();
        const mainContent = document.getElementById('mainContent');
        
        mainContent.innerHTML = `
            <section class="products-section">
                <div class="container">
                    <div class="section-header fade-up">
                        <h2 class="section-title">🌟 پرفروش‌ترین محصولات</h2>
                    </div>
                    <div class="products-grid" id="productsGrid"></div>
                </div>
            </section>
        `;

        this.renderProductsGrid(content, 'productsGrid');
    }

    async renderProducts(options = {}) {
        let products = await this.api.fetchProducts();
        const mainContent = document.getElementById('mainContent');

        if (options.search) {
            products = products.filter(p => 
                p.name.toLowerCase().includes(options.search.toLowerCase())
            );
        }

        mainContent.innerHTML = `
            <section class="products-section">
                <div class="container">
                    <div class="section-header fade-up">
                        <h2 class="section-title">🛍️ تمام محصولات</h2>
                        <p>${products.length} محصول</p>
                    </div>
                    <div class="products-grid" id="productsGrid"></div>
                </div>
            </section>
        `;

        this.renderProductsGrid(products, 'productsGrid');
    }

    renderProductsGrid(products, containerId) {
        const grid = document.getElementById(containerId);
        if (!grid) return;

        grid.innerHTML = products.map(p => `
            <div class="product-card fade-up">
                <div class="product-image">
                    <img src="${p.image_url}" alt="${p.name}" 
                         onerror="this.src='https://via.placeholder.com/400x300/F7F7F9/94A3B8?text=${p.category_name}'">
                    ${p.old_price ? `
                        <span class="product-discount-badge">
                            ٪${Math.round(((p.old_price - p.price) / p.old_price) * 100)}−
                        </span>
                    ` : ''}
                    <button class="product-wishlist" onclick="app.toggleWishlist(${p.id})">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-category">${p.category_name}</div>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-price-row">
                        <div class="product-price">
                            ${p.old_price ? `<span class="price-old">${this.ui.formatPrice(p.old_price)}</span>` : ''}
                            <span class="price-current">${this.ui.formatPrice(p.price)} تومان</span>
                        </div>
                        <button class="btn-add-cart" onclick="app.addToCart(${p.id}, '${p.name}', ${p.price})">
                            افزودن
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderCart() {
        const cart = this.getCart();
        const mainContent = document.getElementById('mainContent');
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        mainContent.innerHTML = `
            <section class="cart-section">
                <div class="container">
                    <h2>🛒 سبد خرید</h2>
                    ${cart.length === 0 ? `
                        <p>سبد خرید خالی است</p>
                        <button class="btn-primary" onclick="app.navigate('products')">
                            مشاهده محصولات
                        </button>
                    ` : `
                        <div class="cart-items">
                            ${cart.map(item => `
                                <div class="cart-item">
                                    <h4>${item.name}</h4>
                                    <p>تعداد: ${item.quantity}</p>
                                    <p>قیمت: ${this.ui.formatPrice(item.price)}</p>
                                    <button onclick="app.removeFromCart(${item.id})">حذف</button>
                                </div>
                            `).join('')}
                        </div>
                        <div class="cart-total">
                            <h3>جمع کل: ${this.ui.formatPrice(total)} تومان</h3>
                            <button class="btn-primary" onclick="app.checkout()">نهایی کردن خرید</button>
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    renderWishlist() {
        const wishlist = this.getWishlist();
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <section class="wishlist-section">
                <div class="container">
                    <h2>❤️ لیست علاقه‌مندی‌ها</h2>
                    ${wishlist.length === 0 ? `
                        <p>هنوز کالایی به لیست علاقه‌مندی اضافه نشده است</p>
                    ` : `
                        <div class="wishlist-items">
                            ${wishlist.map(item => `
                                <div class="wishlist-item">
                                    <p>${item.name}</p>
                                    <button onclick="app.removeFromWishlist(${item.id})">حذف</button>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </section>
        `;
    }

    renderLogin() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <section class="auth-section">
                <div class="auth-container">
                    <h2>🔐 ورود</h2>
                    <form id="loginForm">
                        <input type="email" id="email" placeholder="ایمیل" required>
                        <input type="password" id="password" placeholder="رمز عبور" required>
                        <button type="submit" class="btn-primary">ورود</button>
                        <p>حساب کاربری ندارید؟ <a href="javascript:app.navigate('register')">ثبت نام</a></p>
                    </form>
                </div>
            </section>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await this.api.login(email, password);
                this.ui.showToast('ورود موفقیت‌آمیز ✓');
                setTimeout(() => this.navigate('user-dashboard'), 1000);
            } catch (error) {
                this.ui.showToast(error.message, 'error');
            }
        });
    }

    renderRegister() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <section class="auth-section">
                <div class="auth-container">
                    <h2>📝 ثبت نام</h2>
                    <form id="registerForm">
                        <input type="text" id="username" placeholder="نام کاربری" required>
                        <input type="email" id="email" placeholder="ایمیل" required>
                        <input type="password" id="password" placeholder="رمز عبور" required>
                        <button type="submit" class="btn-primary">ثبت نام</button>
                        <p>حساب دارید؟ <a href="javascript:app.navigate('login')">ورود</a></p>
                    </form>
                </div>
            </section>
        `;

        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                await this.api.register(username, email, password);
                this.ui.showToast('ثبت نام موفق! اکنون وارد شوید');
                setTimeout(() => this.navigate('login'), 1500);
            } catch (error) {
                this.ui.showToast(error.message, 'error');
            }
        });
    }

    async renderUserDashboard() {
        const user = this.auth.getCurrentUser();
        const orders = await this.api.getUserOrders();
        const mainContent = document.getElementById('mainContent');

        mainContent.innerHTML = `
            <section class="dashboard-section">
                <div class="container">
                    <h2>👤 داشبورد کاربر</h2>
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h3>اطلاعات کاربری</h3>
                            <p>نام: ${user.username}</p>
                            <p>نقش: کاربر عادی</p>
                            <button class="btn-primary" onclick="app.renderUserProfile()">تغییر پروفایل</button>
                        </div>
                        <div class="dashboard-card">
                            <h3>📦 سفارشات (${orders.length})</h3>
                            <div class="orders-list">
                                ${orders.length === 0 ? '<p>سفارشی ثبت نشده</p>' : orders.map(order => `
                                    <div class="order-item">
                                        <p>سفارش #${order.id}</p>
                                        <p>وضعیت: <strong>${order.status}</strong></p>
                                        <p>جمع: ${this.ui.formatPrice(order.total_price)} تومان</p>
                                        <small>${new Date(order.created_at).toLocaleDateString('fa-IR')}</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    async renderAdminDashboard() {
        const mainContent = document.getElementById('mainContent');
        const stats = await this.api.getAdminStats();
        const users = await this.api.getUsers();
        const orders = await this.api.getOrders();

        mainContent.innerHTML = `
            <section class="admin-dashboard">
                <div class="container">
                    <h2>⚙️ پنل ادمین</h2>
                    
                    <div class="admin-stats">
                        <div class="stat-card">
                            <h3>👥 کاربران: ${users.length}</h3>
                        </div>
                        <div class="stat-card">
                            <h3>📦 سفارشات: ${orders.length}</h3>
                        </div>
                        <div class="stat-card">
                            <h3>💰 درآمد کل: ${this.ui.formatPrice(stats.totalRevenue)}</h3>
                        </div>
                    </div>

                    <div class="admin-tabs">
                        <button onclick="app.showAdminTab('users')" class="btn-primary">کاربران</button>
                        <button onclick="app.showAdminTab('products')" class="btn-primary">محصولات</button>
                        <button onclick="app.showAdminTab('orders')" class="btn-primary">سفارشات</button>
                    </div>

                    <div id="adminContent"></div>
                </div>
            </section>
        `;
    }

    showAdminTab(tab) {
        const content = document.getElementById('adminContent');
        
        if (tab === 'users') {
            this.showAdminUsers();
        } else if (tab === 'products') {
            this.showAdminProducts();
        } else if (tab === 'orders') {
            this.showAdminOrders();
        }
    }

    async showAdminUsers() {
        const users = await this.api.getUsers();
        const content = document.getElementById('adminContent');

        content.innerHTML = `
            <div class="admin-table">
                <h3>مدیریت کاربران</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>نام کاربری</th>
                            <th>ایمیل</th>
                            <th>نقش</th>
                            <th>تاریخ عضویت</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.id}</td>
                                <td>${user.username}</td>
                                <td>${user.email}</td>
                                <td>${user.role}</td>
                                <td>${new Date(user.created_at).toLocaleDateString('fa-IR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async showAdminProducts() {
        const products = await this.api.getAdminProducts();
        const content = document.getElementById('adminContent');

        content.innerHTML = `
            <div class="admin-section">
                <h3>مدیریت محصولات</h3>
                <button class="btn-primary" onclick="app.showAddProductForm()">افزودن محصول جدید</button>
                
                <div class="admin-table">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>نام</th>
                                <th>قیمت</th>
                                <th>موجودی</th>
                                <th>دسته‌بندی</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${products.map(product => `
                                <tr>
                                    <td>${product.id}</td>
                                    <td>${product.name}</td>
                                    <td>${this.ui.formatPrice(product.price)}</td>
                                    <td>${product.stock}</td>
                                    <td>${product.category_name}</td>
                                    <td>
                                        <button onclick="app.editProduct(${product.id})">ویرایش</button>
                                        <button onclick="app.deleteProduct(${product.id})">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    async showAdminOrders() {
        const orders = await this.api.getOrders();
        const content = document.getElementById('adminContent');

        content.innerHTML = `
            <div class="admin-table">
                <h3>مدیریت سفارشات</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID سفارش</th>
                            <th>کاربر</th>
                            <th>جمع کل</th>
                            <th>وضعیت</th>
                            <th>تاریخ</th>
                            <th>عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>#${order.id}</td>
                                <td>${order.username}</td>
                                <td>${this.ui.formatPrice(order.total_price)}</td>
                                <td>
                                    <select onchange="app.updateOrderStatus(${order.id}, this.value)">
                                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>در انتظار</option>
                                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>در حال پردازش</option>
                                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>ارسال شده</option>
                                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تحویل داده شده</option>
                                    </select>
                                </td>
                                <td>${new Date(order.created_at).toLocaleDateString('fa-IR')}</td>
                                <td>
                                    <button onclick="app.viewOrderDetails(${order.id})">جزئیات</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // توابع کمکی سبد خرید
    addToCart(id, name, price) {
        let cart = this.getCart();
        const item = cart.find(i => i.id === id);
        
        if (item) {
            item.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        this.saveCart(cart);
        this.updateCartBadge();
        this.ui.showToast(`${name} به سبد خرید اضافه شد ✓`);
    }

    removeFromCart(id) {
        let cart = this.getCart();
        cart = cart.filter(i => i.id !== id);
        this.saveCart(cart);
        this.renderCart();
        this.updateCartBadge();
    }

    toggleWishlist(productId) {
        let wishlist = this.getWishlist();
        const index = wishlist.findIndex(i => i.id === productId);
        
        if (index === -1) {
            wishlist.push({ id: productId, name: '', addedAt: new Date() });
            this.ui.showToast('به لیست علاقه‌مندی اضافه شد ❤️');
        } else {
            wishlist.splice(index, 1);
            this.ui.showToast('از لیست علاقه‌مندی حذف شد');
        }
        
        this.saveWishlist(wishlist);
    }

    removeFromWishlist(id) {
        let wishlist = this.getWishlist();
        wishlist = wishlist.filter(i => i.id !== id);
        this.saveWishlist(wishlist);
        this.renderWishlist();
    }

    // Local Storage
    getCart() { return JSON.parse(localStorage.getItem('cart')) || []; }
    saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }
    getWishlist() { return JSON.parse(localStorage.getItem('wishlist')) || []; }
    saveWishlist(wishlist) { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }

    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = this.getCart().length || '۰';
    }

    async checkout() {
        if (!this.auth.isAuthenticated()) {
            this.ui.showToast('ابتدا وارد شوید', 'error');
            this.navigate('login');
            return;
        }

        const cart = this.getCart();
        if (cart.length === 0) {
            this.ui.showToast('سبد خرید خالی است', 'error');
            return;
        }

        try {
            const result = await this.api.createOrder(cart);
            this.ui.showToast('سفارش ثبت شد! ✓');
            this.saveCart([]);
            this.updateCartBadge();
            setTimeout(() => this.navigate('user-dashboard'), 1500);
        } catch (error) {
            this.ui.showToast(error.message, 'error');
        }
    }
}

// اجرای برنامه
window.app = new App();
window.addEventListener('load', () => {
    console.log('[APP] ✅ برنامه بارگذاری شد');
});