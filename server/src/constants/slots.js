/**
 * Slot constants for daily glucose readings.
 * Keep these in sync with the client-side constants and the DB enum.
 */

const SLOTS = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

const SLOT_KEYS = Object.keys(SLOTS);

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const MAX_READINGS_PER_DAY = 4;

module.exports = {
  SLOTS,
  SLOT_KEYS,
  MIN_VALUE,
  MAX_VALUE,
  MAX_READINGS_PER_DAY,
};
