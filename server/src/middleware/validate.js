const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Middleware wrapper for Zod schema validation.
 * Validates request body, query params, or params against a Zod schema.
 * 
 * @param {object} schema - Zod schema object with optional body, query, params
 * @returns {Function} Express middleware
 * 
 * @example
 * router.post('/readings', validate({ body: createReadingSchema }), controller);
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      // Validate each part of the request
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Convert Zod errors to our standard format
        const fields = {};
        const issues = error.issues;
        issues.forEach((err) => {
          const field = err.path.join('.');
          fields[field] = err.message;
        });

        // Use the first error message as the main message
        const firstError = issues[0];
        const message = firstError.message;

        next(new AppError(400, 'VALIDATION_ERROR', message, fields));
      } else {
        next(error);
      }
    }
  };
}

module.exports = validate;
