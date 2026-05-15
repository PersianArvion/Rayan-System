/**
 * Product Renderer
 * @file public/js/modules/products.js
 */

import { formatPrice, initAnimations } from '../utils/ui.js';
import { cart } from './cart.js';
import { wishlist } from './wishlist.js';

export const products = {
    /**
     * Render products grid
     */
    render: (productList, containerId = 'productsGrid') => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (productList.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;">محصولی یافت نشد</div>';
            return;
        }

        container.innerHTML = productList.map((product, index) => `
            <div class="product-card fade-up" style="transition-delay:${index * 0.05}s">
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.name}" loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x300/F7F7F9/94A3B8?text=محصول'">
                    ${product.old_price ? `
                        <span class="product-discount-badge">
                            ٪${Math.round(((product.old_price - product.price) / product.old_price) * 100)}−
                        </span>
                    ` : ''}
                    <button class="product-wishlist ${wishlist.isInWishlist(product.id) ? 'active' : ''}"
                            onclick="window.toggleWishlistItem(${product.id})">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category_name || 'محصول'}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-rating">
                        <div class="stars">
                            ${[...Array(5)].map((_, i) => `
                                <svg class="star ${i < 4 ? '' : 'empty'}" viewBox="0 0 24 24">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                            `).join('')}
                        </div>
                        <span class="rating-count">(${Math.floor(Math.random() * 50) + 10})</span>
                    </div>
                    <div class="product-price-row">
                        <div class="product-price">
                            ${product.old_price ? `<span class="price-old">${formatPrice(product.old_price)}</span>` : ''}
                            <span class="price-current">${formatPrice(product.price)} تومان</span>
                        </div>
                        <button class="btn-add-cart" onclick="window.addToCartItem(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})">
                            افزودن
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        initAnimations();
    }
};

// Global functions for onclick
window.addToCartItem = (id, name, price) => {
    cart.addItem({ id, name, price });
};

window.toggleWishlistItem = (productId) => {
    const items = wishlist.getItems();
    const product = items.find(p => p.id === productId) || { id: productId, name: 'محصول' };
    wishlist.toggle(product);
    
    // Update button UI
    const btn = event.target.closest('.product-wishlist');
    if (btn) btn.classList.toggle('active');
};
