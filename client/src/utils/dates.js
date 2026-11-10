/**
 * Date utility functions for the client.
 * Simplified versions of server-side date utils.
 */

/**
 * Get today's date as YYYY-MM-DD string.
 * @returns {string}
 */
export function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validate if a string is a valid YYYY-MM-DD date.
 * @param {string} dateString
 * @returns {boolean}
 */
export function isValidDateString(dateString) {
  if (typeof dateString !== 'string') return false;

  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Check if a date is in the future.
 * @param {string} dateString - YYYY-MM-DD
 * @returns {boolean}
 */
export function isFutureDate(dateString) {
  if (!isValidDateString(dateString)) return false;
  const today = getTodayString();
  return dateString > today;
}
