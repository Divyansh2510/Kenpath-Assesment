/**
 * Client-side constants.
 * Keep in sync with server/src/constants/slots.js
 */

export const SLOTS = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

export const SLOT_KEYS = Object.keys(SLOTS);

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;
export const MAX_READINGS_PER_DAY = 4;
