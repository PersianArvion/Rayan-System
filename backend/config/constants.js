/**
 * Application Constants
 * @file backend/config/constants.js
 */

module.exports = {
    // User Roles
    ROLES: {
        ADMIN: 'admin',
        USER: 'user'
    },

    // Order Status
    ORDER_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        SHIPPED: 'shipped',
        DELIVERED: 'delivered',
        CANCELLED: 'cancelled'
    },

    // JWT Configuration
    JWT_EXPIRY: '7d',
    
    // Password Hashing
    BCRYPT_ROUNDS: 10,

    // API Messages (Persian)
    MESSAGES: {
        AUTH: {
            REGISTER_SUCCESS: 'ثبت نام موفقیت‌آمیز بود',
            LOGIN_SUCCESS: 'ورود موفقیت‌آمیز بود',
            INVALID_CREDENTIALS: 'ایمیل یا رمز عبور اشتباه است',
            TOKEN_REQUIRED: 'توکن ضروری است',
            TOKEN_INVALID: 'توکن نامعتبر است',
            UNAUTHORIZED: 'دسترسی رد شد',
            USER_EXISTS: 'این کاربر قبلاً ثبت شده است',
            EMAIL_EXISTS: 'این ایمیل قبلاً ثبت شده است',
            FIELDS_REQUIRED: 'تمام فیلدها ضروری هستند'
        },
        PRODUCT: {
            NOT_FOUND: 'محصول یافت نشد',
            FETCH_ERROR: 'خطا در دریافت محصولات',
            ADD_SUCCESS: 'محصول با موفقیت اضافه شد',
            UPDATE_SUCCESS: 'محصول با موفقیت به‌روز رسانی شد',
            DELETE_SUCCESS: 'محصول با موفقیت حذف شد',
            INVALID_FIELDS: 'نام و قیمت محصول ضروری هستند'
        },
        ORDER: {
            CREATED: 'سفارش با موفقیت ثبت شد',
            NOT_FOUND: 'سفارش یافت نشد',
            STATUS_UPDATED: 'وضعیت سفارش به‌روز رسانی شد',
            NO_ITEMS: 'لطفاً محصول انتخاب کنید',
            INVALID_TOTAL: 'مبلغ نامعتبر است'
        },
        GENERAL: {
            SERVER_ERROR: 'خطای سرویس',
            NOT_FOUND: 'مورد جستجو یافت نشد'
        }
    }
};
