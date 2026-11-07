/**
 * Date utility function tests.
 * These are pure functions with no database dependencies.
 */
const {
  getTodayString,
  isValidDateString,
  isFutureDate,
  startOfMonth,
  previousMonthRange,
  formatLabel,
  formatRangeLabel,
} = require('../src/utils/dates');

describe('Date Utilities', () => {
  describe('getTodayString', () => {
    it('should return a valid YYYY-MM-DD string', () => {
      const today = getTodayString('Asia/Kolkata');
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(isValidDateString(today)).toBe(true);
    });

    it('should respect the timezone', () => {
      // This test might be flaky at timezone boundaries, but is generally stable
      const kolkata = getTodayString('Asia/Kolkata');
      const utc = getTodayString('UTC');
      // Should be same or within 1 day
      const diff = Math.abs(new Date(kolkata) - new Date(utc));
      expect(diff).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    });
  });

  describe('isValidDateString', () => {
    it('should accept valid dates', () => {
      expect(isValidDateString('2026-10-15')).toBe(true);
      expect(isValidDateString('2024-02-29')).toBe(true); // leap year
      expect(isValidDateString('2000-12-31')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidDateString('2026-10-1')).toBe(false); // single digit day
      expect(isValidDateString('2026-1-15')).toBe(false); // single digit month
      expect(isValidDateString('10-15-2026')).toBe(false); // wrong order
      expect(isValidDateString('2026/10/15')).toBe(false); // wrong separator
      expect(isValidDateString('abc')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString(null)).toBe(false);
      expect(isValidDateString(undefined)).toBe(false);
    });

    it('should reject invalid calendar dates', () => {
      expect(isValidDateString('2026-02-30')).toBe(false); // Feb 30 doesn't exist
      expect(isValidDateString('2026-13-01')).toBe(false); // month 13
      expect(isValidDateString('2026-00-15')).toBe(false); // month 0
      expect(isValidDateString('2026-10-32')).toBe(false); // day 32
      expect(isValidDateString('2023-02-29')).toBe(false); // not a leap year
    });
  });

  describe('isFutureDate', () => {
    it('should detect future dates', () => {
      // Use a reliable future date
      expect(isFutureDate('2030-01-01', 'Asia/Kolkata')).toBe(true);
      expect(isFutureDate('2050-12-31', 'Asia/Kolkata')).toBe(true);
    });

    it('should not mark today or past as future', () => {
      const today = getTodayString('Asia/Kolkata');
      expect(isFutureDate(today, 'Asia/Kolkata')).toBe(false);

      expect(isFutureDate('2020-01-01', 'Asia/Kolkata')).toBe(false);
      expect(isFutureDate('2026-01-01', 'Asia/Kolkata')).toBe(false);
    });

    it('should return false for invalid dates', () => {
      expect(isFutureDate('invalid', 'Asia/Kolkata')).toBe(false);
      expect(isFutureDate('2026-02-30', 'Asia/Kolkata')).toBe(false);
    });
  });

  describe('startOfMonth', () => {
    it('should return first day of month', () => {
      expect(startOfMonth('2026-10-15')).toBe('2026-10-01');
      expect(startOfMonth('2026-10-01')).toBe('2026-10-01');
      expect(startOfMonth('2026-10-31')).toBe('2026-10-01');
      expect(startOfMonth('2026-01-20')).toBe('2026-01-01');
    });

    it('should throw on invalid dates', () => {
      expect(() => startOfMonth('invalid')).toThrow('Invalid date string');
      expect(() => startOfMonth('2026-02-30')).toThrow('Invalid date string');
    });
  });

  describe('previousMonthRange', () => {
    it('should return previous month range', () => {
      // October -> September
      expect(previousMonthRange('2026-10-15')).toEqual({
        from: '2026-09-01',
        to: '2026-09-30',
      });

      // March -> February (non-leap year)
      expect(previousMonthRange('2026-03-10')).toEqual({
        from: '2026-02-01',
        to: '2026-02-28',
      });

      // March -> February (leap year)
      expect(previousMonthRange('2024-03-10')).toEqual({
        from: '2024-02-01',
        to: '2024-02-29',
      });
    });

    it('should handle January to December of previous year', () => {
      expect(previousMonthRange('2026-01-15')).toEqual({
        from: '2025-12-01',
        to: '2025-12-31',
      });

      expect(previousMonthRange('2024-01-01')).toEqual({
        from: '2023-12-01',
        to: '2023-12-31',
      });
    });

    it('should handle months with 31 days', () => {
      // May -> April (30 days)
      expect(previousMonthRange('2026-05-01')).toEqual({
        from: '2026-04-01',
        to: '2026-04-30',
      });

      // August -> July (31 days)
      expect(previousMonthRange('2026-08-15')).toEqual({
        from: '2026-07-01',
        to: '2026-07-31',
      });
    });

    it('should throw on invalid dates', () => {
      expect(() => previousMonthRange('invalid')).toThrow('Invalid date string');
      expect(() => previousMonthRange('2026-02-30')).toThrow('Invalid date string');
    });
  });

  describe('formatLabel', () => {
    it('should format single dates correctly', () => {
      expect(formatLabel('2026-10-15')).toBe('15 Oct 2026');
      expect(formatLabel('2026-01-01')).toBe('1 Jan 2026');
      expect(formatLabel('2026-12-31')).toBe('31 Dec 2026');
    });

    it('should throw on invalid dates', () => {
      expect(() => formatLabel('invalid')).toThrow('Invalid date string');
      expect(() => formatLabel('2026-02-30')).toThrow('Invalid date string');
    });
  });

  describe('formatRangeLabel', () => {
    it('should format date ranges in same month', () => {
      expect(formatRangeLabel('2026-10-01', '2026-10-15')).toBe('1 – 15 Oct 2026');
      expect(formatRangeLabel('2026-10-01', '2026-10-31')).toBe('1 – 31 Oct 2026');
    });

    it('should format date ranges across months', () => {
      expect(formatRangeLabel('2026-09-01', '2026-10-15')).toBe('1 Sep – 15 Oct 2026');
      expect(formatRangeLabel('2026-01-15', '2026-02-20')).toBe('15 Jan – 20 Feb 2026');
    });

    it('should format previous month ranges correctly', () => {
      expect(formatRangeLabel('2026-09-01', '2026-09-30')).toBe('1 – 30 Sep 2026');
      expect(formatRangeLabel('2026-02-01', '2026-02-28')).toBe('1 – 28 Feb 2026');
      expect(formatRangeLabel('2024-02-01', '2024-02-29')).toBe('1 – 29 Feb 2024'); // leap year
    });

    it('should throw on invalid dates', () => {
      expect(() => formatRangeLabel('invalid', '2026-10-15')).toThrow('Invalid date string');
      expect(() => formatRangeLabel('2026-10-15', 'invalid')).toThrow('Invalid date string');
    });
  });
});
