/**
 * Wishlist Manager
 * @file public/js/modules/wishlist.js
 */

import storage from '../services/storage.js';
import { showToast } from '../utils/ui.js';

export const wishlist = {
    getItems: () => storage.getWishlist(),

    addItem: (product) => {
        storage.addToWishlist(product);
        showToast('به لیست علاقه‌مندی‌ها اضافه شد');
        wishlist.updateBadge();
    },

    removeItem: (productId) => {
        storage.removeFromWishlist(productId);
        showToast('از لیست علاقه‌مندی‌ها حذف شد');
        wishlist.updateBadge();
    },

    isInWishlist: (productId) => {
        return storage.getWishlist().some(item => item.id === productId);
    },

    toggle: (product) => {
        if (wishlist.isInWishlist(product.id)) {
            wishlist.removeItem(product.id);
            return false;
        } else {
            wishlist.addItem(product);
            return true;
        }
    },

    updateBadge: () => {
        const badge = document.querySelector('.icon-btn[title="علاقه‌مندی‌ها"] .badge');
        if (badge) {
            const count = storage.getWishlist().length;
            badge.textContent = count.toLocaleString('fa-IR');
        }
    }
};
