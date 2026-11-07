/**
 * Database migration script.
 * Reads and executes schema.sql to create/update the database schema.
 * 
 * Usage: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Running database migrations...');
    await pool.query(schema);
    console.log('✅ Migrations completed successfully');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();
