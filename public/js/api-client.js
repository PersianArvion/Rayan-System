export class ApiClient {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
    }

    // --- Log Helper ---
    log(method, url, data = null, response = null) {
        console.group(`[API] ${method} ${url}`);
        console.log('📤 Request:', data || 'No body');
        console.log('📥 Response:', response);
        console.groupEnd();
    }

    async request(method, endpoint, body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (body) options.body = JSON.stringify(body);

        console.log(`[NETWORK] ${method} ${url}`, body);

        try {
            const response = await fetch(url, options);
            const data = await response.json();

            this.log(method, endpoint, body, data);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`[ERROR] ${method} ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Auth ---
    async register(username, email, password) {
        return this.request('POST', '/auth/register', { username, email, password });
    }

    async login(email, password) {
        const data = await this.request('POST', '/auth/login', { email, password });
        this.token = data.token;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    }

    // --- Products ---
    async fetchProducts() {
        return this.request('GET', '/products');
    }

    async getAdminProducts() {
        return this.request('GET', '/admin/products');
    }

    async addProduct(productData) {
        return this.request('POST', '/admin/products', productData);
    }

    // --- Orders ---
    async getUserOrders() {
        return this.request('GET', '/user/orders');
    }

    async getOrders() {
        return this.request('GET', '/admin/orders');
    }

    async createOrder(items) {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        return this.request('POST', '/user/order', { items, total });
    }

    // --- Users ---
    async getUsers() {
        return this.request('GET', '/admin/users');
    }

    // --- Stats ---
    async getAdminStats() {
        return this.request('GET', '/admin/stats');
    }
}
