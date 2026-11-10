const pool = require('../db/pool');

/**
 * Users repository - handles all database operations for users.
 * Contains only SQL queries, no business logic.
 */

/**
 * Create a new user.
 * @param {string} name
 * @param {string} email - Must be lowercased
 * @param {string} passwordHash
 * @returns {Promise<object>} User object (without password_hash)
 */
async function createUser(name, email, passwordHash) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
  );
  return result.rows[0];
}

/**
 * Find a user by email.
 * @param {string} email - Must be lowercased
 * @returns {Promise<object|null>} User object with password_hash, or null
 */
async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Find a user by ID.
 * @param {number} userId
 * @returns {Promise<object|null>} User object (without password_hash), or null
 */
async function findUserById(userId) {
  const result = await pool.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
};
