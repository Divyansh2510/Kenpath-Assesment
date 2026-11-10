const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../schemas/auth.schemas');

const router = express.Router();

/**
 * POST /api/auth/register - Register a new user
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * POST /api/auth/login - Login with email and password
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * GET /api/auth/me - Get current user profile (requires authentication)
 */
router.get('/me', authenticate, authController.me);

module.exports = router;
