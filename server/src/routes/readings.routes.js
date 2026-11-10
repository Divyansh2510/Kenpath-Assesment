const express = require('express');
const readingsController = require('../controllers/readings.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const {
  createReadingSchema,
  updateReadingSchema,
  listReadingsQuerySchema,
  idParamSchema,
} = require('../schemas/reading.schemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/readings - Create a new reading
 */
router.post(
  '/',
  validate({ body: createReadingSchema }),
  readingsController.create
);

/**
 * GET /api/readings - List readings (with optional date filter and pagination)
 */
router.get(
  '/',
  validate({ query: listReadingsQuerySchema }),
  readingsController.list
);

/**
 * GET /api/readings/:id - Get a single reading
 */
router.get(
  '/:id',
  validate({ params: idParamSchema }),
  readingsController.getOne
);

/**
 * PUT /api/readings/:id - Update a reading
 */
router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateReadingSchema }),
  readingsController.update
);

/**
 * DELETE /api/readings/:id - Delete a reading
 */
router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  readingsController.remove
);

module.exports = router;
