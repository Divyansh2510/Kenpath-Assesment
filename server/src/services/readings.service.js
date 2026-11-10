const readingsRepo = require('../repositories/readings.repository');
const { MAX_READINGS_PER_DAY, SLOTS } = require('../constants/slots');
const AppError = require('../utils/AppError');
const pool = require('../db/pool');

/**
 * Readings service - contains business logic for readings.
 */

/**
 * Create a new reading with validation.
 * Rules checked: max 4 per day, one per slot per day.
 * 
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @param {string} slot - Enum value
 * @param {number} value
 * @returns {Promise<object>} Created reading
 * @throws {AppError} Validation errors (409)
 */
async function createReading(userId, date, slot, value) {
  // Use a transaction with advisory lock to prevent race conditions
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Advisory lock on the user ID to prevent concurrent inserts
    await client.query('SELECT pg_advisory_xact_lock($1)', [userId]);
    
    // Rule 7: Check if user already has 4 readings for this date
    const countResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [userId, date]
    );
    const count = countResult.rows[0].count;
    
    if (count >= MAX_READINGS_PER_DAY) {
      throw new AppError(
        409,
        'CONFLICT',
        'You can add only 4 readings per day.',
        { date: 'You can add only 4 readings per day.' }
      );
    }
    
    // Rule 6: Check if slot is already occupied
    const existsResult = await client.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND slot = $3',
      [userId, date, slot]
    );
    
    if (existsResult.rows.length > 0) {
      const slotLabel = SLOTS[slot];
      throw new AppError(
        409,
        'CONFLICT',
        `You already have a ${slotLabel} reading for this date.`,
        { slot: `You already have a ${slotLabel} reading for this date.` }
      );
    }
    
    // Create the reading
    const result = await client.query(
      `INSERT INTO readings (user_id, reading_date, slot, value, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, user_id, reading_date AS date, slot, value, created_at, updated_at`,
      [userId, date, slot, value]
    );
    
    await client.query('COMMIT');
    
    const reading = result.rows[0];
    reading.slotLabel = SLOTS[slot];
    return reading;
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Handle unique constraint violation (backup to transaction logic)
    if (error.code === '23505' && error.constraint === 'uq_user_date_slot') {
      const slotLabel = SLOTS[slot];
      throw new AppError(
        409,
        'CONFLICT',
        `You already have a ${slotLabel} reading for this date.`,
        { slot: `You already have a ${slotLabel} reading for this date.` }
      );
    }
    
    throw error;
  } finally {
    client.release();
  }
}

/**
 * List readings (by date or all, paginated).
 * @param {number} userId
 * @param {object} options - { date?, page?, limit? }
 * @returns {Promise<Array|object>} Readings or paginated response
 */
async function listReadings(userId, { date, page, limit } = {}) {
  if (date) {
    // Return readings for specific date
    const readings = await readingsRepo.findReadingsByDate(userId, date);
    return { data: readings };
  } else {
    // Return paginated all readings
    return await readingsRepo.findAllReadings(userId, page, limit);
  }
}

/**
 * Get a single reading.
 * @param {number} userId
 * @param {number} readingId
 * @returns {Promise<object>} Reading
 * @throws {AppError} 404 if not found or not owned by user
 */
async function getReading(userId, readingId) {
  const reading = await readingsRepo.findReadingById(readingId);
  
  if (!reading || reading.user_id !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Reading not found');
  }
  
  return reading;
}

/**
 * Update a reading with validation.
 * @param {number} userId
 * @param {number} readingId
 * @param {string} date - YYYY-MM-DD
 * @param {string} slot - Enum value
 * @param {number} value
 * @returns {Promise<object>} Updated reading
 * @throws {AppError} Validation errors or 404
 */
async function updateReading(userId, readingId, date, slot, value) {
  // Check reading exists and belongs to user
  const existing = await readingsRepo.findReadingById(readingId);
  
  if (!existing || existing.user_id !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Reading not found');
  }
  
  // Rule 7: If date is changing, check if target date already has 4 readings
  if (date !== existing.date) {
    const count = await readingsRepo.countReadingsByDate(userId, date);
    if (count >= MAX_READINGS_PER_DAY) {
      throw new AppError(
        409,
        'CONFLICT',
        'You can add only 4 readings per day.',
        { date: 'You can add only 4 readings per day.' }
      );
    }
  }
  
  // Rule 6: Check if slot is already occupied (excluding this reading)
  const slotExists = await readingsRepo.existsByDateAndSlot(userId, date, slot, readingId);
  
  if (slotExists) {
    const slotLabel = SLOTS[slot];
    throw new AppError(
      409,
      'CONFLICT',
      `You already have a ${slotLabel} reading for this date.`,
      { slot: `You already have a ${slotLabel} reading for this date.` }
    );
  }
  
  // Update the reading
  try {
    return await readingsRepo.updateReading(readingId, date, slot, value);
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === '23505' && error.constraint === 'uq_user_date_slot') {
      const slotLabel = SLOTS[slot];
      throw new AppError(
        409,
        'CONFLICT',
        `You already have a ${slotLabel} reading for this date.`,
        { slot: `You already have a ${slotLabel} reading for this date.` }
      );
    }
    throw error;
  }
}

/**
 * Delete a reading.
 * @param {number} userId
 * @param {number} readingId
 * @returns {Promise<void>}
 * @throws {AppError} 404 if not found or not owned by user
 */
async function deleteReading(userId, readingId) {
  // Check reading exists and belongs to user
  const reading = await readingsRepo.findReadingById(readingId);
  
  if (!reading || reading.user_id !== userId) {
    throw new AppError(404, 'NOT_FOUND', 'Reading not found');
  }
  
  await readingsRepo.deleteReading(readingId);
}

module.exports = {
  createReading,
  listReadings,
  getReading,
  updateReading,
  deleteReading,
};
