const { z } = require('zod');
const { SLOT_KEYS, MIN_VALUE, MAX_VALUE } = require('../constants/slots');
const { isValidDateString, isFutureDate } = require('../utils/dates');
const env = require('../config/env');

/**
 * Validation schemas for reading endpoints.
 */

// Custom validator for integer-only glucose values
const glucoseValue = z.union([
  z.number(),
  z.string(),
]).transform((val, ctx) => {
  // Handle empty strings
  if (val === '' || val === null || val === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please enter a glucose value.',
    });
    return z.NEVER;
  }

  // Convert to number
  const num = Number(val);

  // Check if it's a valid number
  if (isNaN(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
    });
    return z.NEVER;
  }

  // Check if it's an integer (reject decimals)
  if (!Number.isInteger(num)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
    });
    return z.NEVER;
  }

  // Check range
  if (num < MIN_VALUE || num > MAX_VALUE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`,
    });
    return z.NEVER;
  }

  return num;
});

// Date validator
const dateField = z.string()
  .min(1, 'Please select a valid date.')
  .refine(isValidDateString, 'Please select a valid date.')
  .refine(
    (date) => !isFutureDate(date, env.timezone),
    'Date cannot be in the future.'
  );

// Slot validator
const slotField = z.enum(SLOT_KEYS, {
  errorMap: () => ({ message: 'Please select a valid time slot.' }),
});

const createReadingSchema = z.object({
  date: dateField,
  slot: slotField,
  value: glucoseValue,
});

const updateReadingSchema = z.object({
  date: dateField,
  slot: slotField,
  value: glucoseValue,
});

const listReadingsQuerySchema = z.object({
  date: z.string().optional().refine(
    (date) => !date || isValidDateString(date),
    'Please select a valid date.'
  ),
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => {
    if (!val) return 20;
    const num = parseInt(val, 10);
    return Math.min(num, 100); // Max 100 per page
  }),
});

const idParamSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

module.exports = {
  createReadingSchema,
  updateReadingSchema,
  listReadingsQuerySchema,
  idParamSchema,
};
