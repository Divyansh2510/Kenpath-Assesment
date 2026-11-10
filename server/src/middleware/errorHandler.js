const AppError = require('../utils/AppError');

/**
 * Central error handling middleware.
 * Formats all errors into a consistent JSON structure.
 * 
 * Error response format:
 * {
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human-readable message",
 *     "fields": { "fieldName": "Field-specific error" } // optional
 *   }
 * }
 */
function errorHandler(err, req, res, next) {
  // Default to 500 internal server error
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred.';
  let fields = null;

  // Handle operational errors (AppError instances)
  if (err.isOperational) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    fields = err.fields;
  } 
  // Handle Zod validation errors
  else if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    fields = {};
    err.errors.forEach((error) => {
      const path = error.path.join('.');
      fields[path] = error.message;
    });
  }
  // Handle PostgreSQL unique constraint violations
  else if (err.code === '23505') {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'A record with this information already exists.';
  }
  // Log unexpected errors
  else {
    console.error('Unexpected error:', err);
  }

  // Send error response
  const response = {
    error: {
      code,
      message,
    },
  };

  if (fields) {
    response.error.fields = fields;
  }

  // In development, include stack trace
  if (process.env.NODE_ENV === 'development' && !err.isOperational) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
