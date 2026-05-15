/**
 * Main Application Entry Point
 * @file public/js/app.js
 */

import { auth } from './modules/auth.js';
import { cart } from './modules/cart.js';
import { wishlist } from './modules/wishlist.js';
import { products } from './modules/products.js';
import apiClient from './services/api-client.js';
import storage from './services/storage.js';
import { initAnimations, initHeaderScroll, initBackToTop, showToast, debounce } from './utils/ui.js';

/**
 * Initialize UI Components
 */
function initUI() {
    initAnimations();
    initHeaderScroll();
    initBackToTop();
    
    // Update badges
    cart.updateBadge();
    wishlist.updateBadge();
    
    // Setup navigation
    setupNavigation();
}

/**
 * Setup Navigation
 */
function setupNavigation() {
    // Account button
    const accountBtn = document.querySelector('.icon-btn[title="حساب کاربری"]');
    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            if (auth.isAdmin()) {
                window.location.href = '/admin.html';
            } else if (auth.isAuthenticated()) {
                window.location.href = '/dashboard.html';
            } else {
                window.location.href = '/login.html';
            }
        });
    }

    // Cart button
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            window.location.href = '/cart.html';
        });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async (e) => {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                const result = await apiClient.products.search(query);
                if (result.ok) {
                    products.render(result.data.data);
                }
            }
        }, 300));
    }
}

/**
 * Load Products
 */
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    const result = await apiClient.products.getAll();
    if (result.ok) {
        products.render(result.data);
    } else {
        showToast('خطا در بارگیری محصولات', 'error');
    }
}

/**
 * Setup Forms
 */
function setupForms() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (await auth.login(email, password)) {
                setTimeout(() => {
                    if (auth.isAdmin()) {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                }, 1000);
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (await auth.register(username, email, password)) {
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            }
        });
    }
}

/**
 * Initialize App
 */
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    setupForms();
    loadProducts();
});

// Export for global access
window.app = {
    auth,
    cart,
    wishlist,
    products,
    apiClient,
    storage
};
