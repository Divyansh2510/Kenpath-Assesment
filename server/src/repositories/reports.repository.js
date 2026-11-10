const pool = require('../db/pool');
const { SLOTS } = require('../constants/slots');

/**
 * Reports repository - handles database queries for reports.
 */

/**
 * Get statistics for a date range.
 * @param {number} userId
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @returns {Promise<{count, highest, lowest, average}>}
 */
async function getStats(userId, from, to) {
  const result = await pool.query(
    `SELECT 
       COUNT(*)::int AS count,
       MAX(value) AS highest,
       MIN(value) AS lowest,
       ROUND(AVG(value)::numeric, 1) AS average
     FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );

  const row = result.rows[0];
  
  return {
    count: row.count,
    highest: row.highest,
    lowest: row.lowest,
    average: row.average ? Number(row.average) : null, // pg returns numeric as string
  };
}

/**
 * Get readings for a specific date (for daily report).
 * @param {number} userId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Array>}
 */
async function getReadingsForDate(userId, date) {
  const result = await pool.query(
    `SELECT id, slot, value
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
    id: row.id,
    slot: row.slot,
    slotLabel: SLOTS[row.slot],
    value: row.value,
  }));
}

module.exports = {
  getStats,
  getReadingsForDate,
};
