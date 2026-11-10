const pool = require('../db/pool');
const { SLOTS } = require('../constants/slots');

/**
 * Readings repository - handles all database operations for readings.
 * Contains only SQL queries, no business logic.
 */

/**
 * Create a new reading.
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @param {string} slot - Enum value
 * @param {number} value
 * @returns {Promise<object>} Reading with slotLabel
 */
async function createReading(userId, date, slot, value) {
  const result = await pool.query(
    `INSERT INTO readings (user_id, reading_date, slot, value, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, user_id, reading_date AS date, slot, value, created_at, updated_at`,
    [userId, date, slot, value]
  );
  
  const reading = result.rows[0];
  reading.slotLabel = SLOTS[slot];
  return reading;
}

/**
 * Find all readings for a user on a specific date.
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array>} Readings with slotLabel
 */
async function findReadingsByDate(userId, date) {
  const result = await pool.query(
    `SELECT id, user_id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings
     WHERE user_id = $1 AND reading_date = $2
     ORDER BY 
       CASE slot
         WHEN 'MORNING_FASTING' THEN 1
         WHEN 'AFTER_BREAKFAST' THEN 2
         WHEN 'AFTER_LUNCH' THEN 3
         WHEN 'AFTER_DINNER' THEN 4
       END`,
    [userId, date]
  );
  
  return result.rows.map(row => ({
    ...row,
    slotLabel: SLOTS[row.slot],
  }));
}

/**
 * Find all readings for a user, paginated.
 * @param {number} userId
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Results per page
 * @returns {Promise<{data, pagination}>}
 */
async function findAllReadings(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  // Get total count
  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS total FROM readings WHERE user_id = $1',
    [userId]
  );
  const total = countResult.rows[0].total;

  // Get paginated data
  const result = await pool.query(
    `SELECT id, user_id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings
     WHERE user_id = $1
     ORDER BY reading_date DESC, created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const data = result.rows.map(row => ({
    ...row,
    slotLabel: SLOTS[row.slot],
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Find a reading by ID.
 * @param {number} readingId
 * @returns {Promise<object|null>} Reading with slotLabel, or null
 */
async function findReadingById(readingId) {
  const result = await pool.query(
    `SELECT id, user_id, reading_date AS date, slot, value, created_at, updated_at
     FROM readings
     WHERE id = $1`,
    [readingId]
  );
  
  if (!result.rows[0]) return null;
  
  const reading = result.rows[0];
  reading.slotLabel = SLOTS[reading.slot];
  return reading;
}

/**
 * Update a reading.
 * @param {number} readingId
 * @param {string} date - YYYY-MM-DD
 * @param {string} slot - Enum value
 * @param {number} value
 * @returns {Promise<object>} Updated reading with slotLabel
 */
async function updateReading(readingId, date, slot, value) {
  const result = await pool.query(
    `UPDATE readings
     SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING id, user_id, reading_date AS date, slot, value, created_at, updated_at`,
    [date, slot, value, readingId]
  );
  
  const reading = result.rows[0];
  reading.slotLabel = SLOTS[slot];
  return reading;
}

/**
 * Delete a reading.
 * @param {number} readingId
 * @returns {Promise<void>}
 */
async function deleteReading(readingId) {
  await pool.query('DELETE FROM readings WHERE id = $1', [readingId]);
}

/**
 * Count readings for a user on a specific date.
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<number>}
 */
async function countReadingsByDate(userId, date) {
  const result = await pool.query(
    'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
    [userId, date]
  );
  return result.rows[0].count;
}

/**
 * Check if a reading exists for a user on a date and slot.
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @param {string} slot - Enum value
 * @param {number} excludeId - Reading ID to exclude (for updates)
 * @returns {Promise<boolean>}
 */
async function existsByDateAndSlot(userId, date, slot, excludeId = null) {
  let query = 'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3';
  const params = [userId, date, slot];
  
  if (excludeId !== null) {
    query += ' AND id != $4';
    params.push(excludeId);
  }
  
  const result = await pool.query(query, params);
  return result.rows.length > 0;
}

module.exports = {
  createReading,
  findReadingsByDate,
  findAllReadings,
  findReadingById,
  updateReading,
  deleteReading,
  countReadingsByDate,
  existsByDateAndSlot,
};
