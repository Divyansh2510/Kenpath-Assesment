/**
 * Custom error class for application errors.
 * Includes HTTP status code, error code, message, and optional field errors.
 */
class AppError extends Error {
  constructor(statusCode, code, message, fields = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory methods for common error types
   */
  static validationError(message, fields = null) {
    return new AppError(400, 'VALIDATION_ERROR', message, fields);
  }

  static unauthorized(message = 'Please log in to continue.') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static notFound(message = 'The requested resource was not found.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(message, fields = null) {
    return new AppError(409, 'CONFLICT', message, fields);
  }

  static internalError(message = 'An unexpected error occurred.') {
    return new AppError(500, 'INTERNAL_ERROR', message);
  }
}

module.exports = AppError;
