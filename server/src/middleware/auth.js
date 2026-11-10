const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches user info to req.user.
 */
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwt.secret);
    } catch (err) {
      throw new AppError(401, 'UNAUTHORIZED', 'Please log in to continue.');
    }

    // Attach user ID to request
    req.user = { id: decoded.sub };
    
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
