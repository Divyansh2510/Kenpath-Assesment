const express = require('express');
const reportsController = require('../controllers/reports.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const { reportQuerySchema } = require('../schemas/report.schemas');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/reports/daily - Daily report
 */
router.get(
  '/daily',
  validate({ query: reportQuerySchema }),
  reportsController.daily
);

/**
 * GET /api/reports/month-to-date - Month-to-date report
 */
router.get(
  '/month-to-date',
  validate({ query: reportQuerySchema }),
  reportsController.monthToDate
);

/**
 * GET /api/reports/monthly - Previous month report
 */
router.get(
  '/monthly',
  validate({ query: reportQuerySchema }),
  reportsController.monthly
);

module.exports = router;
