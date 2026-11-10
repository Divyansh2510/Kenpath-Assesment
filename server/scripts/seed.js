/**
 * Seed script for development.
 * Creates a demo user with sample readings for the last 45 days.
 * 
 * Usage: npm run seed
 */
const bcrypt = require('bcrypt');
const pool = require('../src/db/pool');
const env = require('../src/config/env');
const { getTodayString } = require('../src/utils/dates');

const DEMO_USER = {
  name: 'Demo Patient',
  email: 'demo@sweety.test',
  password: 'Demo@1234',
};

const SLOTS = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

// Typical glucose ranges (mg/dl)
const RANGES = {
  MORNING_FASTING: { min: 80, max: 130 },
  AFTER_BREAKFAST: { min: 110, max: 200 },
  AFTER_LUNCH: { min: 110, max: 220 },
  AFTER_DINNER: { min: 110, max: 200 },
};

/**
 * Get a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random glucose value for a slot.
 */
function randomValue(slot) {
  const range = RANGES[slot];
  return randomInt(range.min, range.max);
}

/**
 * Subtract days from a date string.
 */
function subtractDays(dateString, days) {
  const date = new Date(dateString + 'T00:00:00');
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Main seed function.
 */
async function seed() {
  // Warn if running in production
  if (env.nodeEnv === 'production') {
    console.error('⚠️  WARNING: Cannot run seed script in production!');
    process.exit(1);
  }

  console.log('🌱 Starting seed process...\n');

  try {
    // Check if demo user exists
    let userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [DEMO_USER.email]
    );

    let userId;

    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`✓ Demo user already exists (ID: ${userId})`);
      
      // Delete existing readings
      const deleteResult = await pool.query(
        'DELETE FROM readings WHERE user_id = $1',
        [userId]
      );
      console.log(`✓ Deleted ${deleteResult.rowCount} existing readings\n`);
    } else {
      // Create demo user
      const passwordHash = await bcrypt.hash(DEMO_USER.password, env.bcrypt.saltRounds);
      
      userResult = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [DEMO_USER.name, DEMO_USER.email, passwordHash]
      );
      
      userId = userResult.rows[0].id;
      console.log(`✓ Created demo user (ID: ${userId})\n`);
    }

    // Generate readings for the last 45 days
    const today = getTodayString(env.timezone);
    const readings = [];
    let insertedCount = 0;
    let skippedCount = 0;

    for (let daysAgo = 45; daysAgo >= 0; daysAgo--) {
      const date = subtractDays(today, daysAgo);
      
      // Randomly select 2-4 slots for this day (skip ~15% of slots)
      const numSlots = randomInt(2, 4);
      const selectedSlots = [...SLOTS]
        .sort(() => Math.random() - 0.5)
        .slice(0, numSlots);

      for (const slot of selectedSlots) {
        const value = randomValue(slot);
        readings.push({ date, slot, value });
      }
    }

    // Insert all readings
    for (const reading of readings) {
      try {
        await pool.query(
          'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
          [userId, reading.date, reading.slot, reading.value]
        );
        insertedCount++;
      } catch (error) {
        // Skip duplicates (shouldn't happen, but just in case)
        if (error.code === '23505') {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    console.log('📊 Seed Summary:');
    console.log(`   • User: ${DEMO_USER.name}`);
    console.log(`   • Email: ${DEMO_USER.email}`);
    console.log(`   • Password: ${DEMO_USER.password}`);
    console.log(`   • Readings inserted: ${insertedCount}`);
    if (skippedCount > 0) {
      console.log(`   • Readings skipped: ${skippedCount}`);
    }
    console.log(`   • Date range: ${subtractDays(today, 45)} to ${today}\n`);

    console.log('✅ Seed completed successfully!');
    console.log(`\n🔑 Login with: ${DEMO_USER.email} / ${DEMO_USER.password}\n`);

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seed
seed();
