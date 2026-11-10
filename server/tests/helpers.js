/**
 * Test helper functions.
 */
const authService = require('../src/services/auth.service');

/**
 * Create a user and return the user object with token.
 * @param {object} data - Optional overrides for name, email, password
 * @returns {Promise<{user, token}>}
 */
async function createUserAndToken(data = {}) {
  const defaults = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  const userData = { ...defaults, ...data };
  return await authService.register(userData.name, userData.email, userData.password);
}

module.exports = {
  createUserAndToken,
};
