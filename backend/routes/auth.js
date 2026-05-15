/**
 * Authentication Routes
 * @file backend/routes/auth.js
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbPromise = require('../db');
const { isValidEmail, isValidPassword, isValidUsername } = require('../utils/validators');
const { MESSAGES, BCRYPT_ROUNDS } = require('../config/constants');
const { JWT_SECRET } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: true,
                message: MESSAGES.AUTH.FIELDS_REQUIRED 
            });
        }

        if (!isValidUsername(username)) {
            return res.status(400).json({ 
                error: true,
                message: 'نام کاربری باید بین 3 تا 30 کاراکتر باشد' 
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ 
                error: true,
                message: 'فرمت ایمیل نامعتبر است' 
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({ 
                error: true,
                message: 'رمز عبور باید حداقل 6 کاراکتر باشد' 
            });
        }

        const db = await dbPromise;

        // Check for existing user
        const existingUser = await db.get(
            "SELECT id FROM users WHERE email = ? OR username = ?", 
            [email, username]
        );

        if (existingUser) {
            return res.status(409).json({ 
                error: true,
                message: MESSAGES.AUTH.USER_EXISTS 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Create user
        const result = await db.run(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [username, email, passwordHash, 'user']
        );

        console.log(`✅ User registered: ${email} (ID: ${result.id})`);

        res.status(201).json({ 
            error: false,
            message: MESSAGES.AUTH.REGISTER_SUCCESS,
            userId: result.id 
        });
    } catch (err) {
        console.error('❌ Register error:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR,
            details: err.message 
        });
    }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: true,
                message: MESSAGES.AUTH.FIELDS_REQUIRED 
            });
        }

        const db = await dbPromise;
        const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

        if (!user) {
            return res.status(401).json({ 
                error: true,
                message: MESSAGES.AUTH.INVALID_CREDENTIALS 
            });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ 
                error: true,
                message: MESSAGES.AUTH.INVALID_CREDENTIALS 
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`✅ Login successful: ${email}`);

        res.json({
            error: false,
            message: MESSAGES.AUTH.LOGIN_SUCCESS,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

/**
 * POST /api/auth/verify
 * Verify JWT token
 */
router.post('/verify', (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ 
                error: true,
                valid: false,
                message: MESSAGES.AUTH.TOKEN_REQUIRED 
            });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    error: true,
                    valid: false,
                    message: MESSAGES.AUTH.TOKEN_INVALID 
                });
            }

            res.json({ 
                error: false,
                valid: true, 
                user 
            });
        });
    } catch (err) {
        console.error('❌ Verify error:', err);
        res.status(500).json({ 
            error: true,
            message: MESSAGES.GENERAL.SERVER_ERROR 
        });
    }
});

module.exports = router;
