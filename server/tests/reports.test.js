/**
 * Reports endpoint tests.
 * Tests daily, month-to-date, and monthly reports with various scenarios.
 */
const request = require('supertest');
const createApp = require('../src/app');
const { createUserAndToken } = require('./helpers');
const pool = require('../src/db/pool');

const app = createApp();

// Import test setup
require('./setup');

describe('Reports Endpoints', () => {
  let user, token, userId;

  beforeEach(async () => {
    user = await createUserAndToken({ email: 'test@test.com' });
    token = user.token;
    userId = user.user.id;
  });

  /**
   * Helper function to insert readings directly into the database.
   */
  async function insertReading(date, slot, value) {
    await pool.query(
      'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
      [userId, date, slot, value]
    );
  }

  describe('GET /api/reports/daily', () => {
    it('should return daily report with readings and stats', async () => {
      // Insert readings for a specific date
      await insertReading('2026-10-15', 'MORNING_FASTING', 90);
      await insertReading('2026-10-15', 'AFTER_LUNCH', 150);
      await insertReading('2026-10-15', 'AFTER_DINNER', 140);

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('daily');
      expect(res.body.range).toMatchObject({
        from: '2026-10-15',
        to: '2026-10-15',
        label: '15 Oct 2026',
      });
      expect(res.body.stats).toMatchObject({
        count: 3,
        highest: 150,
        lowest: 90,
        average: 126.7, // (90+150+140)/3 = 126.666... rounded to 1 decimal
      });
      expect(res.body.readings).toHaveLength(3);
      expect(res.body.readings[0]).toMatchObject({
        slot: 'MORNING_FASTING',
        slotLabel: 'Morning (fasting)',
        value: 90,
      });
    });

    it('should return empty stats when no readings exist', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toMatchObject({
        count: 0,
        highest: null,
        lowest: null,
        average: null,
      });
      expect(res.body.readings).toHaveLength(0);
    });

    it('should default to today when date not specified', async () => {
      const res = await request(app)
        .get('/api/reports/daily')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('daily');
      // Should use today's date
      expect(res.body.range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return 400 for future date', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2030-01-01')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Date cannot be in the future.');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/month-to-date', () => {
    it('should return month-to-date report with correct stats', async () => {
      // Insert readings from Oct 1 to Oct 15
      await insertReading('2026-10-01', 'MORNING_FASTING', 80);
      await insertReading('2026-10-05', 'AFTER_LUNCH', 150);
      await insertReading('2026-10-10', 'MORNING_FASTING', 90);
      await insertReading('2026-10-15', 'AFTER_DINNER', 140);

      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('month-to-date');
      expect(res.body.range).toMatchObject({
        from: '2026-10-01',
        to: '2026-10-15',
        label: '1 – 15 Oct 2026',
      });
      expect(res.body.stats).toMatchObject({
        count: 4,
        highest: 150,
        lowest: 80,
        average: 115.0, // (80+150+90+140)/4 = 115
      });
      expect(res.body).not.toHaveProperty('readings'); // MTD doesn't include readings
    });

    it('should only include readings up to selected date', async () => {
      // Insert readings before and after the selected date
      await insertReading('2026-10-01', 'MORNING_FASTING', 80);
      await insertReading('2026-10-10', 'MORNING_FASTING', 90);
      await insertReading('2026-10-20', 'MORNING_FASTING', 200); // After selected date

      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.count).toBe(2); // Only first 2
      expect(res.body.stats.highest).toBe(90); // 200 not included
    });

    it('should handle first day of month', async () => {
      await insertReading('2026-10-01', 'MORNING_FASTING', 90);

      const res = await request(app)
        .get('/api/reports/month-to-date?date=2026-10-01')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.range).toMatchObject({
        from: '2026-10-01',
        to: '2026-10-01',
      });
      expect(res.body.stats.count).toBe(1);
    });
  });

  describe('GET /api/reports/monthly', () => {
    it('should return previous month report', async () => {
      // Selected date: Oct 15, 2026 → Previous month: Sep 2026
      await insertReading('2026-09-01', 'MORNING_FASTING', 85);
      await insertReading('2026-09-15', 'AFTER_LUNCH', 160);
      await insertReading('2026-09-30', 'AFTER_DINNER', 135);
      await insertReading('2026-10-01', 'MORNING_FASTING', 90); // Current month, excluded

      const res = await request(app)
        .get('/api/reports/monthly?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.type).toBe('monthly');
      expect(res.body.range).toMatchObject({
        from: '2026-09-01',
        to: '2026-09-30',
        label: '1 – 30 Sep 2026',
      });
      expect(res.body.stats).toMatchObject({
        count: 3,
        highest: 160,
        lowest: 85,
        average: 126.7, // (85+160+135)/3
      });
      expect(res.body).not.toHaveProperty('readings');
    });

    it('should handle January (previous month = December of previous year)', async () => {
      // Selected: Jan 15, 2026 → Previous: Dec 2025
      await insertReading('2025-12-01', 'MORNING_FASTING', 80);
      await insertReading('2025-12-15', 'AFTER_LUNCH', 150);
      await insertReading('2025-12-31', 'AFTER_DINNER', 140);

      const res = await request(app)
        .get('/api/reports/monthly?date=2026-01-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.range).toMatchObject({
        from: '2025-12-01',
        to: '2025-12-31',
        label: '1 – 31 Dec 2025',
      });
      expect(res.body.stats.count).toBe(3);
    });

    it('should handle February in leap year', async () => {
      // Selected: Mar 10, 2024 → Previous: Feb 2024 (leap year, 29 days)
      await insertReading('2024-02-01', 'MORNING_FASTING', 90);
      await insertReading('2024-02-29', 'MORNING_FASTING', 95); // Leap day

      const res = await request(app)
        .get('/api/reports/monthly?date=2024-03-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.range).toMatchObject({
        from: '2024-02-01',
        to: '2024-02-29',
        label: '1 – 29 Feb 2024',
      });
      expect(res.body.stats.count).toBe(2);
    });

    it('should handle February in non-leap year', async () => {
      // Selected: Mar 10, 2026 → Previous: Feb 2026 (non-leap, 28 days)
      await insertReading('2026-02-01', 'MORNING_FASTING', 90);
      await insertReading('2026-02-28', 'MORNING_FASTING', 95);

      const res = await request(app)
        .get('/api/reports/monthly?date=2026-03-10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.range).toMatchObject({
        from: '2026-02-01',
        to: '2026-02-28',
        label: '1 – 28 Feb 2026',
      });
      expect(res.body.stats.count).toBe(2);
    });
  });

  describe('Stats calculation accuracy', () => {
    it('should calculate average with 1 decimal precision', async () => {
      // Average: (100 + 101 + 102) / 3 = 101.0
      await insertReading('2026-10-15', 'MORNING_FASTING', 100);
      await insertReading('2026-10-15', 'AFTER_BREAKFAST', 101);
      await insertReading('2026-10-15', 'AFTER_LUNCH', 102);

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.stats.average).toBe(101.0);
    });

    it('should round average to 1 decimal place', async () => {
      // Average: (100 + 105 + 110) / 3 = 105.0
      await insertReading('2026-10-15', 'MORNING_FASTING', 100);
      await insertReading('2026-10-15', 'AFTER_BREAKFAST', 105);
      await insertReading('2026-10-15', 'AFTER_LUNCH', 110);

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.stats.average).toBe(105.0);
    });

    it('should handle rounding correctly (132.666... → 132.7)', async () => {
      // Average: (120 + 130 + 148) / 3 = 132.666...
      await insertReading('2026-10-15', 'MORNING_FASTING', 120);
      await insertReading('2026-10-15', 'AFTER_BREAKFAST', 130);
      await insertReading('2026-10-15', 'AFTER_LUNCH', 148);

      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.stats.average).toBe(132.7);
    });
  });

  describe('User isolation', () => {
    let user2, token2;

    beforeEach(async () => {
      user2 = await createUserAndToken({ email: 'user2@test.com' });
      token2 = user2.token;
    });

    it('should only return stats for authenticated user', async () => {
      // User 1 has readings
      await insertReading('2026-10-15', 'MORNING_FASTING', 90);

      // User 2 should see empty stats
      const res = await request(app)
        .get('/api/reports/daily?date=2026-10-15')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.count).toBe(0);
      expect(res.body.readings).toHaveLength(0);
    });
  });
});
