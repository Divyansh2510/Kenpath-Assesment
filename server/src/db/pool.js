const { Pool, types } = require('pg');
const env = require('../config/env');

/**
 * Configure pg to return DATE columns as strings (YYYY-MM-DD) instead of JS Date objects.
 * This prevents timezone-related bugs where dates shift by +/- 1 day.
 * Type ID 1082 = DATE type in PostgreSQL.
 */
types.setTypeParser(1082, val => val);

/**
 * PostgreSQL connection pool.
 * Uses DATABASE_URL from environment (or DATABASE_URL_TEST in test mode).
 */
const pool = new Pool({
  connectionString: env.databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  process.exit(-1);
});

module.exports = pool;
