/**
 * Auth Manager
 * @file public/js/modules/auth.js
 */

import storage from '../services/storage.js';
import apiClient from '../services/api-client.js';
import { showToast } from '../utils/ui.js';

export const auth = {
    isAuthenticated: () => !!storage.getToken(),

    isAdmin: () => {
        const user = storage.getUser();
        return user && user.role === 'admin';
    },

    getCurrentUser: () => storage.getUser(),

    async login(email, password) {
        const result = await apiClient.auth.login(email, password);
        
        if (result.ok) {
            storage.setToken(result.data.token);
            storage.setUser(result.data.user);
            showToast('خوش‌آمدید!');
            return true;
        } else {
            showToast(result.error, 'error');
            return false;
        }
    },

    async register(username, email, password) {
        const result = await apiClient.auth.register(username, email, password);
        
        if (result.ok) {
            showToast('ثبت نام موفقیت‌آمیز بود. وارد شوید.');
            return true;
        } else {
            showToast(result.error, 'error');
            return false;
        }
    },

    logout() {
        storage.removeToken();
        storage.removeUser();
        window.location.href = '/login.html';
    }
};
