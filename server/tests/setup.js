/**
 * Test setup and teardown.
 * Runs schema migrations and clears data before each test.
 */
const fs = require('fs');
const path = require('path');
const pool = require('../src/db/pool');

// Run schema once before all tests
beforeAll(async () => {
  const schemaPath = path.join(__dirname, '../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(schema);
});

// Clear all data before each test
beforeEach(async () => {
  await pool.query('TRUNCATE users, readings RESTART IDENTITY CASCADE');
});

// Close pool after all tests
afterAll(async () => {
  await pool.end();
});
