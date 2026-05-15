// public/js/auth.js
export const auth = {
    getToken() {
        return localStorage.getItem('token');
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    isAdmin() {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.role === 'admin';
    },
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};