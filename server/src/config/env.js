require('dotenv').config();

/**
 * Validates and exports environment variables.
 * Throws an error at startup if critical variables are missing.
 */
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please copy .env.example to .env and configure the values.'
    );
  }
}

validateEnv();

module.exports = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.NODE_ENV === 'test' 
    ? process.env.DATABASE_URL_TEST 
    : process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
  nodeEnv: process.env.NODE_ENV || 'development',
};
