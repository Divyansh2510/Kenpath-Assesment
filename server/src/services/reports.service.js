const reportsRepo = require('../repositories/reports.repository');
const {
  getTodayString,
  startOfMonth,
  previousMonthRange,
  formatLabel,
  formatRangeLabel,
} = require('../utils/dates');
const env = require('../config/env');

/**
 * Reports service - contains business logic for reports.
 */

/**
 * Get daily report for a specific date.
 * @param {number} userId
 * @param {string} [date] - YYYY-MM-DD, defaults to today
 * @returns {Promise<object>} Report with type, range, stats, readings
 */
async function getDailyReport(userId, date) {
  // Default to today if not specified
  if (!date) {
    date = getTodayString(env.timezone);
  }

  const stats = await reportsRepo.getStats(userId, date, date);
  const readings = await reportsRepo.getReadingsForDate(userId, date);

  return {
    type: 'daily',
    range: {
      from: date,
      to: date,
      label: formatLabel(date),
    },
    stats,
    readings,
  };
}

/**
 * Get month-to-date report.
 * From the 1st of the month to the selected date (or today).
 * @param {number} userId
 * @param {string} [date] - YYYY-MM-DD, defaults to today
 * @returns {Promise<object>} Report with type, range, stats
 */
async function getMonthToDateReport(userId, date) {
  // Default to today if not specified
  if (!date) {
    date = getTodayString(env.timezone);
  }

  const from = startOfMonth(date);
  const to = date;

  const stats = await reportsRepo.getStats(userId, from, to);

  return {
    type: 'month-to-date',
    range: {
      from,
      to,
      label: formatRangeLabel(from, to),
    },
    stats,
  };
}

/**
 * Get monthly report for the previous month relative to the selected date.
 * E.g., if date is 2026-10-15, returns September 2026 (2026-09-01 to 2026-09-30).
 * @param {number} userId
 * @param {string} [date] - YYYY-MM-DD, defaults to today
 * @returns {Promise<object>} Report with type, range, stats
 */
async function getMonthlyReport(userId, date) {
  // Default to today if not specified
  if (!date) {
    date = getTodayString(env.timezone);
  }

  const { from, to } = previousMonthRange(date);

  const stats = await reportsRepo.getStats(userId, from, to);

  return {
    type: 'monthly',
    range: {
      from,
      to,
      label: formatRangeLabel(from, to),
    },
    stats,
  };
}

module.exports = {
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
};
