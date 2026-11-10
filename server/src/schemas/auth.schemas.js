const { z } = require('zod');

/**
 * Validation schemas for authentication endpoints.
 */

const registerSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),
  
  password: z.string()
    .min(1, 'Password is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
};
