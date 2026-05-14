// public/js/api.js
const API_BASE = '/api';

// Network Logger
const NetworkLogger = {
    log(method, endpoint, data = null, status = null, response = null, error = null) {
        const timestamp = new Date().toLocaleTimeString('fa-IR');
        const fullUrl = `${API_BASE}${endpoint}`;
        
        console.group(
            `%c[${timestamp}] ${method} ${endpoint} ${status ? `[${status}]` : ''}`,
            `color: ${status ? (status < 400 ? 'green' : 'red') : 'blue'}; font-weight: bold;`
        );
        
        if (data) console.log('📤 Request:', data);
        if (response) console.log('📥 Response:', response);
        if (error) console.error('❌ Error:', error);
        
        console.log('🌐 URL:', fullUrl);
        console.log('⏰ Timestamp:', timestamp);
        
        console.groupEnd();
    }
};

export const api = {
    async register(username, email, password) {
        const endpoint = '/auth/register';
        const data = { username, email, password };
        
        try {
            NetworkLogger.log('POST', endpoint, data);
            
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const response = await res.json();
            NetworkLogger.log('POST', endpoint, data, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.message || 'خطا در ثبت نام');
            }
            
            return response;
        } catch (error) {
            NetworkLogger.log('POST', endpoint, data, null, null, error);
            throw error;
        }
    },

    async login(email, password) {
        const endpoint = '/auth/login';
        const data = { email, password };
        
        try {
            NetworkLogger.log('POST', endpoint, data);
            
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const response = await res.json();
            NetworkLogger.log('POST', endpoint, data, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.message || 'ایمیل یا رمز عبور اشتباه است');
            }
            
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            
            return response;
        } catch (error) {
            NetworkLogger.log('POST', endpoint, data, null, null, error);
            throw error;
        }
    },

    logout() {
        console.log('🚪 User logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    async fetchProducts() {
        const endpoint = '/products';
        
        try {
            NetworkLogger.log('GET', endpoint);
            
            const res = await fetch(`${API_BASE}${endpoint}`);
            
            if (!res.ok) {
                throw new Error('خطا در دریافت محصولات');
            }
            
            const response = await res.json();
            NetworkLogger.log('GET', endpoint, null, res.status, response);
            
            return response;
        } catch (error) {
            NetworkLogger.log('GET', endpoint, null, null, null, error);
            console.warn('📦 Using fallback products...');
            
            // fallback data
            return [
                { id: 1, name: 'NVIDIA RTX 4090', price: 89500000, old_price: 99000000, image_url: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80', category_name: 'کارت گرافیک' },
                { id: 2, name: 'Intel i9-13900K', price: 28500000, old_price: 32000000, image_url: 'https://images.unsplash.com/photo-1555617117-08ccfc78e9ea?w=400&q=80', category_name: 'پردازنده' },
                { id: 3, name: 'Corsair Vengeance 32GB', price: 8900000, old_price: 10500000, image_url: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=400&q=80', category_name: 'رم' },
                { id: 4, name: 'Samsung 990 Pro 2TB', price: 12500000, old_price: 14000000, image_url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400&q=80', category_name: 'حافظه SSD' }
            ];
        }
    },

    async searchProducts(query) {
        const endpoint = `/search?q=${encodeURIComponent(query)}`;
        
        try {
            NetworkLogger.log('GET', endpoint);
            
            const res = await fetch(`${API_BASE}${endpoint}`);
            const response = await res.json();
            
            NetworkLogger.log('GET', endpoint, null, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.error || 'خطا در جستجو');
            }
            
            return response;
        } catch (error) {
            NetworkLogger.log('GET', endpoint, null, null, null, error);
            throw error;
        }
    },

    async createOrder(items, total) {
        const endpoint = '/user/order';
        const data = { items, total };
        const token = localStorage.getItem('token');
        
        try {
            NetworkLogger.log('POST', endpoint, data);
            
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            const response = await res.json();
            NetworkLogger.log('POST', endpoint, data, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.error || 'خطا در ایجاد سفارش');
            }
            
            return response;
        } catch (error) {
            NetworkLogger.log('POST', endpoint, data, null, null, error);
            throw error;
        }
    },

    async fetchUserOrders() {
        const endpoint = '/user/orders';
        const token = localStorage.getItem('token');
        
        try {
            NetworkLogger.log('GET', endpoint);
            
            const res = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const response = await res.json();
            NetworkLogger.log('GET', endpoint, null, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.error || 'خطا در دریافت سفارشات');
            }
            
            return response;
        } catch (error) {
            NetworkLogger.log('GET', endpoint, null, null, null, error);
            throw error;
        }
    },

    async fetchUserProfile() {
        const endpoint = '/user/profile';
        const token = localStorage.getItem('token');
        
        try {
            NetworkLogger.log('GET', endpoint);
            
            const res = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const response = await res.json();
            NetworkLogger.log('GET', endpoint, null, res.status, response);
            
            if (!res.ok) {
                throw new Error(response.error || 'خطا در دریافت اطلاعات');
            }
            
            return response;
        } catch (error) {
            NetworkLogger.log('GET', endpoint, null, null, null, error);
            throw error;
        }
    }
};