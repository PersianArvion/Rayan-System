/**
 * Input Validation Utilities
 * @file backend/utils/validators.js
 */

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
    return password && password.length >= 6;
};

/**
 * Validate username
 */
const isValidUsername = (username) => {
    return username && username.length >= 3 && username.length <= 30;
};

/**
 * Validate product data
 */
const validateProductData = (data) => {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
        errors.push('نام محصول ضروری است');
    }
    
    if (!data.price || data.price <= 0) {
        errors.push('قیمت محصول باید بیشتر از صفر باشد');
    }

    if (data.old_price && data.old_price <= data.price) {
        errors.push('قیمت قبلی باید بیشتر از قیمت فعلی باشد');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidUsername,
    validateProductData
};
