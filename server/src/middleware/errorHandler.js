const AppError = require('../utils/AppError');

/**
 * Central error handling middleware.
 * Catches all errors and formats them into consistent JSON responses.
 * Hides internal error details in production.
 */
function errorHandler(err, req, res, next) {
  // Default to 500 internal server error
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred';
  let fields = err.fields || null;

  // PostgreSQL unique constraint violation (23505)
  if (err.code === '23505') {
    statusCode = 409;
    code = 'CONFLICT';
    
    // Parse the constraint name to provide a better message
    if (err.constraint === 'users_email_key') {
      message = 'An account with this email already exists.';
      fields = { email: message };
    } else if (err.constraint === 'uq_user_date_slot') {
      message = 'A reading for this slot already exists.';
      fields = { slot: message };
    } else {
      message = 'This record already exists.';
    }
  }

  // Log errors for debugging (but don't expose details to client)
  if (statusCode === 500) {
    console.error('Internal server error:', err);
    message = 'An unexpected error occurred. Please try again later.';
  }

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(fields && { fields }),
    },
  });
}

module.exports = errorHandler;
