/**
 * API Client Service
 * @file public/js/services/api-client.js
 */

const API_BASE = '/api';

const apiClient = {
    /**
     * Make API request
     */
    async request(method, endpoint, body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'خطا در درخواست');
            }

            return { ok: true, data };
        } catch (error) {
            return { ok: false, error: error.message };
        }
    },

    // Auth APIs
    auth: {
        register: (username, email, password) =>
            apiClient.request('POST', '/auth/register', { username, email, password }),
        
        login: (email, password) =>
            apiClient.request('POST', '/auth/login', { email, password }),
        
        verify: (token) =>
            apiClient.request('POST', '/auth/verify', null, token)
    },

    // Product APIs
    products: {
        getAll: () =>
            apiClient.request('GET', '/products'),
        
        getById: (id) =>
            apiClient.request('GET', `/products/${id}`),
        
        search: (query) =>
            apiClient.request('GET', `/search?q=${encodeURIComponent(query)}`),
        
        getCategories: () =>
            apiClient.request('GET', '/categories')
    },

    // User APIs
    user: {
        createOrder: (items, total, token) =>
            apiClient.request('POST', '/user/order', { items, total }, token),
        
        getOrders: (token) =>
            apiClient.request('GET', '/user/orders', null, token),
        
        getOrderById: (id, token) =>
            apiClient.request('GET', `/user/orders/${id}`, null, token),
        
        getProfile: (token) =>
            apiClient.request('GET', '/user/profile', null, token)
    },

    // Admin APIs
    admin: {
        getProducts: (token) =>
            apiClient.request('GET', '/admin/products', null, token),
        
        createProduct: (product, token) =>
            apiClient.request('POST', '/admin/products', product, token),
        
        updateProduct: (id, product, token) =>
            apiClient.request('PUT', `/admin/products/${id}`, product, token),
        
        deleteProduct: (id, token) =>
            apiClient.request('DELETE', `/admin/products/${id}`, null, token),
        
        getOrders: (token) =>
            apiClient.request('GET', '/admin/orders', null, token),
        
        updateOrderStatus: (id, status, token) =>
            apiClient.request('PUT', `/admin/orders/${id}/status`, { status }, token),
        
        getStats: (token) =>
            apiClient.request('GET', '/admin/stats', null, token)
    }
};

export default apiClient;
