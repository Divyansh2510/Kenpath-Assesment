const { z } = require('zod');
const AppError = require('../utils/AppError');

/**
 * Middleware factory for validating request data with Zod schemas.
 * 
 * @param {object} schemas - Object with optional 'body', 'params', 'query' Zod schemas
 * @returns {Function} Express middleware
 * 
 * @example
 * router.post('/readings', 
 *   validate({ body: createReadingSchema }),
 *   readingsController.create
 * );
 */
function validate(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Convert Zod errors to our error format
        const fields = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          fields[path] = err.message;
        });
        
        const firstError = error.errors[0];
        next(AppError.validationError(firstError.message, fields));
      } else {
        next(error);
      }
    }
  };
}

module.exports = validate;
