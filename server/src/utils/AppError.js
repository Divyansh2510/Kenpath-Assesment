/**
 * Custom error class for application errors.
 * Used to throw errors with specific HTTP status codes and error codes.
 */
class AppError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code (e.g., 'VALIDATION_ERROR')
   * @param {string} message - Human-readable error message
   * @param {object} [fields] - Optional field-specific error messages
   */
  constructor(statusCode, code, message, fields = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true; // Marks this as an expected error

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
