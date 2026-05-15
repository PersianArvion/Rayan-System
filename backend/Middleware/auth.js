/**
 * Authentication Middleware
 * @file backend/middleware/auth.js
 */

const jwt = require('jsonwebtoken');
const { MESSAGES } = require('../config/constants');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

/**
 * Verify JWT Token
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: true, 
            message: MESSAGES.AUTH.TOKEN_REQUIRED 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('🔐 Token Error:', err.message);
            return res.status(403).json({ 
                error: true, 
                message: MESSAGES.AUTH.TOKEN_INVALID 
            });
        }
        req.user = user;
        next();
    });
};

/**
 * Verify Admin Role
 */
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, () => {
        if (req.user.role !== 'admin') {
            console.error(`❌ Unauthorized admin access attempt by user ${req.user.id}`);
            return res.status(403).json({ 
                error: true, 
                message: MESSAGES.AUTH.UNAUTHORIZED 
            });
        }
        next();
    });
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
    JWT_SECRET
};
