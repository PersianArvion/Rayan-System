// public/js/main.js
import { auth } from './auth.js';
import { api } from './api.js';
import { formatPrice, showToast, initAnimations } from './utils.js';

// --- توابع کمکی ---
function getCart() { return JSON.parse(localStorage.getItem('cart')) || []; }
function saveCart(cart) { 
    localStorage.setItem('cart', JSON.stringify(cart)); 
    updateCartBadge(cart.length); 
}
function updateCartBadge(count) { 
    const badge = document.getElementById('cartBadge');
    if (badge) badge.textContent = count.toLocaleString('fa-IR'); 
}

function getWishlist() { return JSON.parse(localStorage.getItem('wishlist')) || []; }
function saveWishlist(items) { 
    localStorage.setItem('wishlist', JSON.stringify(items)); 
    updateWishlistBadge(items.length); 
}
function updateWishlistBadge(count) { 
    const badge = document.querySelector('.icon-btn[title="علاقه‌مندی‌ها"] .badge');
    if (badge) badge.textContent = count.toLocaleString('fa-IR'); 
}

// --- رندر محصولات (اگر گریدی در صفحه باشد) ---
function renderProducts(products, containerId = 'productsGrid') {
    const grid = document.getElementById(containerId);
    if (!grid) return; // اگر گرید نبود، کاری نکن
    
    // پاک کردن محتوای استاتیک قبلی و جایگزینی با داینامیک
    grid.innerHTML = ''; 
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">محصولی یافت نشد.</p>';
        return;
    }

    grid.innerHTML = products.map((p, i) => `
        <div class="product-card fade-up" style="transition-delay:${i * 0.05}s">
            <div class="product-image">
                <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300/F7F7F9/94A3B8?text=تک‌مارکت'">
                ${p.old_price ? `<span class="product-discount-badge">٪${Math.round(((p.old_price - p.price) / p.old_price) * 100)}−</span>` : ''}
                <button class="product-wishlist" onclick="toggleWishlist(this, ${p.id})">
                    <svg class="icon" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${p.category_name || 'قطعه'}</div>
                <h3 class="product-name">${p.name}</h3>
                <div class="product-rating">
                    <div class="stars">
                        ${Array(5).fill(0).map((_, idx) => `<svg class="star ${idx < 4 ? 'active' : ''}" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`).join('')}
                    </div>
                    <span class="rating-count">(${Math.floor(Math.random() * 50) + 10} نظر)</span>
                </div>
                <div class="product-price-row">
                    <div class="product-price">
                        ${p.old_price ? `<span class="price-old">${formatPrice(p.old_price)}</span>` : ''}
                        <span class="price-current">${formatPrice(p.price)} تومان</span>
                    </div>
                    <button class="btn-add-cart" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}', ${p.price})">
                        افزودن به سبد
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    initAnimations();
}

// --- عملیات سبد خرید و علاقه‌مندی ---
function addToCart(id, name, price) {
    let cart = getCart();
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) existingItem.quantity++;
    else cart.push({ id, name, price, quantity: 1 });
    saveCart(cart);
    showToast('محصول به سبد خرید اضافه شد');
}

function toggleWishlist(btn, productId) {
    let wishlist = getWishlist();
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index === -1) {
        wishlist.push({ id: productId, addedAt: new Date() });
        showToast('به لیست علاقه‌مندی اضافه شد');
    } else {
        wishlist.splice(index, 1);
        showToast('از لیست علاقه‌مندی حذف شد');
    }
    
    saveWishlist(wishlist);
    btn.classList.toggle('active');
    const svg = btn.querySelector('.icon');
    svg.setAttribute('fill', btn.classList.contains('active') ? 'currentColor' : 'none');
}

// --- هندل کردن فرم‌ها ---
function setupForms() {
    // فرم لاگین
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await api.login(email, password);
                showToast('ورود موفقیت‌آمیز بود');
                setTimeout(() => window.location.href = 'dashboard.html', 1000);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    // فرم ثبت نام
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await api.register(username, email, password);
                showToast('ثبت نام موفقیت‌آمیز بود. لطفا وارد شوید.');
                setTimeout(() => window.location.href = 'login.html', 1500);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
}

// --- ناوبری و تنظیمات اولیه ---
function setupNavigation() {
    // تنظیم لینک‌های منو
    const navLinks = document.querySelectorAll('.nav-list li a');
    const navUrls = [
        'index.html', 'index.html?cat=laptop', 'index.html?cat=gpu',
        'index.html?cat=access', 'index.html?cat=gaming', 'index.html?cat=mobile',
        'index.html?cat=network', 'index.html?cat=printer', 'index.html?cat=sale'
    ];
    navLinks.forEach((link, index) => {
        if (index < navUrls.length) link.href = navUrls[index];
    });

    // تنظیم لینک‌های فوتر
    const setFooterLinks = (selector, urls) => {
        document.querySelectorAll(selector).forEach((link, index) => {
            if (index < urls.length) link.href = urls[index];
        });
    };

    setFooterLinks('.footer-column:first-child ul li a', [
        'index.html?cat=laptop', 'index.html?cat=gpu', 'index.html?cat=cpu',
        'index.html?cat=motherboard', 'index.html?cat=ram', 'index.html?cat=ssd'
    ]);

    setFooterLinks('.footer-column:nth-child(2) ul li a', [
        'track-order.html', 'return-policy.html', 'help.html',
        'faq.html', 'privacy.html', 'contact.html'
    ]);

    // دکمه‌های آیکون‌ها
    const accountBtn = document.querySelector('.icon-btn[title="حساب کاربری"]');
    if (accountBtn) {
        accountBtn.onclick = () => {
            if (auth.isAdmin()) window.location.href = 'admin.html';
            else if (auth.isAuthenticated()) window.location.href = 'dashboard.html';
            else window.location.href = 'login.html';
        };
    }
    
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) cartBtn.onclick = () => window.location.href = 'cart.html';
}

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    setupForms();
    updateCartBadge(getCart().length);
    updateWishlistBadge(getWishlist().length);

    // اگر صفحه اصلی است، محصولات را لود کن
    if (document.getElementById('productsGrid')) {
        const urlParams = new URLSearchParams(window.location.search);
        const cat = urlParams.get('cat');
        
        api.fetchProducts().then(products => {
            if (cat) {
                const filtered = products.filter(p => p.category_name && p.category_name.toLowerCase().includes(cat));
                renderProducts(filtered.length ? filtered : products);
            } else {
                renderProducts(products);
            }
        });
    }
});