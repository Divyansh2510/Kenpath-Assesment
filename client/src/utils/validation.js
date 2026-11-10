/**
 * Client-side validation utilities.
 * Mirrors server-side validation for better UX.
 */
import { MIN_VALUE, MAX_VALUE, SLOT_KEYS } from './constants';
import { isValidDateString, isFutureDate, getTodayString } from './dates';

/**
 * Validate glucose value.
 * @param {string|number} value
 * @returns {string|null} Error message or null
 */
export function validateValue(value) {
  if (value === '' || value === null || value === undefined) {
    return 'Please enter a glucose value.';
  }

  const num = Number(value);

  if (isNaN(num)) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }

  if (!Number.isInteger(num)) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }

  if (num < MIN_VALUE || num > MAX_VALUE) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }

  return null;
}

/**
 * Validate slot.
 * @param {string} slot
 * @returns {string|null} Error message or null
 */
export function validateSlot(slot) {
  if (!slot || !SLOT_KEYS.includes(slot)) {
    return 'Please select a valid time slot.';
  }
  return null;
}

/**
 * Validate date.
 * @param {string} date - YYYY-MM-DD
 * @returns {string|null} Error message or null
 */
export function validateDate(date) {
  if (!date) {
    return 'Please select a valid date.';
  }

  if (!isValidDateString(date)) {
    return 'Please select a valid date.';
  }

  if (isFutureDate(date)) {
    return 'Date cannot be in the future.';
  }

  return null;
}

/**
 * Validate entire reading form.
 * @param {object} data - { date, slot, value }
 * @returns {object} { valid: boolean, errors: {date?, slot?, value?} }
 */
export function validateReading(data) {
  const errors = {};

  const dateError = validateDate(data.date);
  if (dateError) errors.date = dateError;

  const slotError = validateSlot(data.slot);
  if (slotError) errors.slot = slotError;

  const valueError = validateValue(data.value);
  if (valueError) errors.value = valueError;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
