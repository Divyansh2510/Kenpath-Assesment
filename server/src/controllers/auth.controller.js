const authService = require('../services/auth.service');

/**
 * Auth controller - handles HTTP request/response for auth endpoints.
 */

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  me,
};
