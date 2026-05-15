/**
 * Cart Manager
 * @file public/js/modules/cart.js
 */

import storage from '../services/storage.js';
import { showToast } from '../utils/ui.js';

export const cart = {
    getItems: () => storage.getCart(),

    addItem: (product) => {
        storage.addToCart(product);
        showToast(`${product.name} به سبد اضافه شد`);
        cart.updateBadge();
    },

    removeItem: (productId) => {
        storage.removeFromCart(productId);
        cart.updateBadge();
        showToast('محصول از سبد حذف شد');
    },

    clear: () => {
        storage.clearCart();
        cart.updateBadge();
    },

    getTotal: () => {
        return storage.getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    updateBadge: () => {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            const count = storage.getCart().length;
            badge.textContent = count.toLocaleString('fa-IR');
        }
    }
};
