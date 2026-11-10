const { z } = require('zod');
const { isValidDateString, isFutureDate } = require('../utils/dates');
const env = require('../config/env');

/**
 * Validation schemas for report endpoints.
 */

const reportQuerySchema = z.object({
  date: z.string()
    .optional()
    .refine(
      (date) => !date || isValidDateString(date),
      'Please select a valid date.'
    )
    .refine(
      (date) => !date || !isFutureDate(date, env.timezone),
      'Date cannot be in the future.'
    ),
});

module.exports = {
  reportQuerySchema,
};
