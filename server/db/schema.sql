-- Sweety Blood Glucose Tracker Database Schema
-- Idempotent: safe to run multiple times

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reading slot enum (4 time slots per day)
DO $$ BEGIN
  CREATE TYPE reading_slot AS ENUM (
    'MORNING_FASTING',
    'AFTER_BREAKFAST',
    'AFTER_LUNCH',
    'AFTER_DINNER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Readings table
CREATE TABLE IF NOT EXISTS readings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date  DATE NOT NULL,
  slot          reading_slot NOT NULL,
  value         INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_date_slot UNIQUE (user_id, reading_date, slot)
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_readings_user_date 
  ON readings (user_id, reading_date);
