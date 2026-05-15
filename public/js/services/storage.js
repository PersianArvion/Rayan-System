/**
 * Local Storage Manager
 * @file public/js/services/storage.js
 */

const storage = {
    // Auth
    setToken: (token) => localStorage.setItem('token', token),
    getToken: () => localStorage.getItem('token'),
    removeToken: () => localStorage.removeItem('token'),

    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
    removeUser: () => localStorage.removeItem('user'),

    // Cart
    getCart: () => JSON.parse(localStorage.getItem('cart') || '[]'),
    setCart: (cart) => localStorage.setItem('cart', JSON.stringify(cart)),
    addToCart: (product) => {
        const cart = storage.getCart();
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        storage.setCart(cart);
        return cart;
    },
    removeFromCart: (productId) => {
        const cart = storage.getCart().filter(item => item.id !== productId);
        storage.setCart(cart);
        return cart;
    },
    clearCart: () => localStorage.removeItem('cart'),

    // Wishlist
    getWishlist: () => JSON.parse(localStorage.getItem('wishlist') || '[]'),
    setWishlist: (wishlist) => localStorage.setItem('wishlist', JSON.stringify(wishlist)),
    addToWishlist: (product) => {
        const wishlist = storage.getWishlist();
        if (!wishlist.find(item => item.id === product.id)) {
            wishlist.push(product);
        }
        storage.setWishlist(wishlist);
        return wishlist;
    },
    removeFromWishlist: (productId) => {
        const wishlist = storage.getWishlist().filter(item => item.id !== productId);
        storage.setWishlist(wishlist);
        return wishlist;
    },

    // Clear all
    clearAll: () => {
        localStorage.clear();
    }
};

export default storage;
