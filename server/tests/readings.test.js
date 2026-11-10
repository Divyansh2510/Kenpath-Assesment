/**
 * Readings endpoint tests.
 * Tests all validation rules, CRUD operations, and user isolation.
 */
const request = require('supertest');
const createApp = require('../src/app');
const { createUserAndToken } = require('./helpers');

const app = createApp();

// Import test setup
require('./setup');

describe('Readings Endpoints', () => {
  let user1, token1, user2, token2;

  beforeEach(async () => {
    // Create two users for isolation testing
    user1 = await createUserAndToken({ email: 'user1@test.com' });
    token1 = user1.token;

    user2 = await createUserAndToken({ email: 'user2@test.com' });
    token2 = user2.token;
  });

  describe('POST /api/readings - Create', () => {
    it('should create a reading successfully', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 95,
        });

      expect(res.status).toBe(201);
      expect(res.body.reading).toMatchObject({
        date: '2026-10-15',
        slot: 'MORNING_FASTING',
        slotLabel: 'Morning (fasting)',
        value: 95,
      });
      expect(res.body.reading).toHaveProperty('id');
    });

    // Rule 1: Value is required
    it('should return 400 when value is missing', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toBe('Please enter a glucose value.');
      expect(res.body.error.fields.value).toBe('Please enter a glucose value.');
    });

    it('should return 400 when value is empty string', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Please enter a glucose value.');
    });

    // Rule 2: Value must be integer 40-600
    it('should return 400 when value is 39 (below minimum)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
      expect(res.body.error.fields.value).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should return 400 when value is 601 (above maximum)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should return 400 when value is decimal (100.5)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 100.5,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should return 400 when value is non-numeric string', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 'abc',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should accept numeric string like "120"', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: '120',
        });

      expect(res.status).toBe(201);
      expect(res.body.reading.value).toBe(120);
    });

    // Rule 3: Slot must be valid enum
    it('should return 400 for invalid slot', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'INVALID_SLOT',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Please select a valid time slot.');
      expect(res.body.error.fields.slot).toBe('Please select a valid time slot.');
    });

    // Rule 4: Date must be valid
    it('should return 400 for invalid date format', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '15-10-2026',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Please select a valid date.');
      expect(res.body.error.fields.date).toBe('Please select a valid date.');
    });

    it('should return 400 for non-existent date (Feb 30)', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-02-30',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Please select a valid date.');
    });

    // Rule 5: Date cannot be in the future
    it('should return 400 for future date', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2030-01-01',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('Date cannot be in the future.');
      expect(res.body.error.fields.date).toBe('Date cannot be in the future.');
    });

    // Rule 6: One reading per slot per day
    it('should return 409 for duplicate slot on same date', async () => {
      // Create first reading
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'AFTER_LUNCH',
          value: 150,
        });

      // Try to create second reading with same slot
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          date: '2026-10-15',
          slot: 'AFTER_LUNCH',
          value: 160,
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
      expect(res.body.error.message).toBe('You already have an After lunch reading for this date.');
      expect(res.body.error.fields.slot).toContain('After lunch');
    });

    // Rule 7: Max 4 readings per day (checked before rule 6)
    it('should return 409 when adding 5th reading to a full day', async () => {
      const date = '2026-10-15';

      // Create 4 readings (one for each slot)
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date, slot: 'MORNING_FASTING', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date, slot: 'AFTER_BREAKFAST', value: 120 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date, slot: 'AFTER_LUNCH', value: 150 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date, slot: 'AFTER_DINNER', value: 140 });

      // Try to add a 5th reading (with any slot, even if duplicate)
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date, slot: 'MORNING_FASTING', value: 95 });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('You can add only 4 readings per day.');
      expect(res.body.error.fields.date).toBe('You can add only 4 readings per day.');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/readings')
        .send({
          date: '2026-10-15',
          slot: 'MORNING_FASTING',
          value: 100,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/readings - List', () => {
    beforeEach(async () => {
      // Create sample readings for user1
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 150 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-14', slot: 'MORNING_FASTING', value: 95 });
    });

    it('should list readings for a specific date', async () => {
      const res = await request(app)
        .get('/api/readings?date=2026-10-15')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].slot).toBe('MORNING_FASTING'); // Ordered by slot
      expect(res.body.data[1].slot).toBe('AFTER_LUNCH');
    });

    it('should list all readings (paginated) when no date specified', async () => {
      const res = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 3,
        totalPages: 1,
      });
    });

    it('should only return readings for authenticated user', async () => {
      // User2 should not see user1's readings
      const res = await request(app)
        .get('/api/readings?date=2026-10-15')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/readings/:id - Get One', () => {
    let readingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 90 });
      
      readingId = res.body.reading.id;
    });

    it('should get a reading by ID', async () => {
      const res = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.reading.id).toBe(readingId);
      expect(res.body.reading.value).toBe(90);
    });

    it('should return 404 when accessing another user\'s reading', async () => {
      const res = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
      expect(res.body.error.message).toBe('Reading not found');
    });

    it('should return 404 for non-existent reading', async () => {
      const res = await request(app)
        .get('/api/readings/99999')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/readings/:id - Update', () => {
    let readingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 90 });
      
      readingId = res.body.reading.id;
    });

    it('should update a reading successfully', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 95 });

      expect(res.status).toBe(200);
      expect(res.body.reading.value).toBe(95);
    });

    it('should return 409 when updating to an occupied slot', async () => {
      // Create another reading in a different slot
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 150 });

      // Try to update first reading to the occupied slot
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 95 });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toContain('After lunch');
    });

    it('should return 409 when moving to a full day', async () => {
      const fullDate = '2026-10-16';

      // Fill up another date with 4 readings
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: fullDate, slot: 'MORNING_FASTING', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: fullDate, slot: 'AFTER_BREAKFAST', value: 120 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: fullDate, slot: 'AFTER_LUNCH', value: 150 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: fullDate, slot: 'AFTER_DINNER', value: 140 });

      // Try to move original reading to the full day
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: fullDate, slot: 'MORNING_FASTING', value: 95 });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toBe('You can add only 4 readings per day.');
    });

    it('should return 404 when updating another user\'s reading', async () => {
      const res = await request(app)
        .put(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 95 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/readings/:id - Delete', () => {
    let readingId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${token1}`)
        .send({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 90 });
      
      readingId = res.body.reading.id;
    });

    it('should delete a reading successfully', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(204);

      // Verify it's deleted
      const getRes = await request(app)
        .get(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(getRes.status).toBe(404);
    });

    it('should return 404 when deleting another user\'s reading', async () => {
      const res = await request(app)
        .delete(`/api/readings/${readingId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent reading', async () => {
      const res = await request(app)
        .delete('/api/readings/99999')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
    });
  });
});
