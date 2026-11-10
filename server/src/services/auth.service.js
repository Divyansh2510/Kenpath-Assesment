const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usersRepo = require('../repositories/users.repository');
const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Auth service - contains business logic for authentication.
 */

/**
 * Register a new user.
 * @param {string} name
 * @param {string} email - Already validated and lowercased
 * @param {string} password - Plain text
 * @returns {Promise<{user, token}>}
 * @throws {AppError} If email already exists
 */
async function register(name, email, password) {
  // Check if user already exists
  const existing = await usersRepo.findUserByEmail(email);
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'An account with this email already exists.', {
      email: 'An account with this email already exists.',
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds);

  // Create user
  const user = await usersRepo.createUser(name, email, passwordHash);

  // Generate token
  const token = generateToken(user.id);

  return { user, token };
}

/**
 * Login with email and password.
 * @param {string} email - Already validated and lowercased
 * @param {string} password - Plain text
 * @returns {Promise<{user, token}>}
 * @throws {AppError} If credentials are invalid
 */
async function login(email, password) {
  // Find user
  const user = await usersRepo.findUserByEmail(email);
  
  // Always use the same error message for email/password errors (security best practice)
  const invalidMessage = 'Invalid email or password.';
  
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', invalidMessage);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    throw new AppError(401, 'UNAUTHORIZED', invalidMessage);
  }

  // Remove password_hash from response
  const { password_hash, ...userWithoutPassword } = user;

  // Generate token
  const token = generateToken(user.id);

  return { user: userWithoutPassword, token };
}

/**
 * Get user profile by ID.
 * @param {number} userId
 * @returns {Promise<object>}
 * @throws {AppError} If user not found
 */
async function getUserProfile(userId) {
  const user = await usersRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  return user;
}

/**
 * Generate a JWT token for a user.
 * @param {number} userId
 * @returns {string} JWT token
 */
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

module.exports = {
  register,
  login,
  getUserProfile,
  generateToken,
};
