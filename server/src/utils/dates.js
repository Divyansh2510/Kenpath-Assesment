/**
 * Pure date utility functions.
 * All functions work with YYYY-MM-DD strings to avoid timezone bugs.
 * Heavily tested in dates.test.js.
 */

/**
 * Get today's date as YYYY-MM-DD string in the specified timezone.
 * @param {string} timezone - IANA timezone (e.g., 'Asia/Kolkata')
 * @returns {string} YYYY-MM-DD
 */
function getTodayString(timezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Validate if a string is a valid YYYY-MM-DD date that exists on the calendar.
 * @param {string} dateString - Date string to validate
 * @returns {boolean}
 */
function isValidDateString(dateString) {
  if (typeof dateString !== 'string') return false;

  // Check format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  // Check if it's a real calendar date
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Check if a date string is in the future relative to today in the given timezone.
 * @param {string} dateString - YYYY-MM-DD
 * @param {string} timezone - IANA timezone
 * @returns {boolean}
 */
function isFutureDate(dateString, timezone) {
  if (!isValidDateString(dateString)) return false;
  const today = getTodayString(timezone);
  return dateString > today;
}

/**
 * Get the first day of the month for a given date.
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string} YYYY-MM-01
 */
function startOfMonth(dateString) {
  if (!isValidDateString(dateString)) {
    throw new Error('Invalid date string');
  }
  const [year, month] = dateString.split('-');
  return `${year}-${month}-01`;
}

/**
 * Get the date range for the previous month relative to a given date.
 * Handles year boundaries (January -> December of previous year) and leap years.
 * @param {string} dateString - YYYY-MM-DD
 * @returns {{ from: string, to: string }} Both in YYYY-MM-DD format
 */
function previousMonthRange(dateString) {
  if (!isValidDateString(dateString)) {
    throw new Error('Invalid date string');
  }

  const [year, month] = dateString.split('-').map(Number);

  let prevYear = year;
  let prevMonth = month - 1;

  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }

  const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;

  // Get last day of previous month
  const lastDay = new Date(prevYear, prevMonth, 0).getDate();
  const to = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { from, to };
}

/**
 * Format a date string as "15 Oct 2026"
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string}
 */
function formatLabel(dateString) {
  if (!isValidDateString(dateString)) {
    throw new Error('Invalid date string');
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${day} ${monthNames[month - 1]} ${year}`;
}

/**
 * Format a date range as "1 Oct – 15 Oct 2026"
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 * @returns {string}
 */
function formatRangeLabel(from, to) {
  if (!isValidDateString(from) || !isValidDateString(to)) {
    throw new Error('Invalid date string');
  }

  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fromMonthName = monthNames[fromMonth - 1];
  const toMonthName = monthNames[toMonth - 1];

  if (fromMonth === toMonth && fromYear === toYear) {
    return `${fromDay} – ${toDay} ${toMonthName} ${toYear}`;
  }

  return `${fromDay} ${fromMonthName} – ${toDay} ${toMonthName} ${toYear}`;
}

module.exports = {
  getTodayString,
  isValidDateString,
  isFutureDate,
  startOfMonth,
  previousMonthRange,
  formatLabel,
  formatRangeLabel,
};
