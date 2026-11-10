const reportsService = require('../services/reports.service');

/**
 * Reports controller - handles HTTP request/response for reports endpoints.
 */

/**
 * GET /api/reports/daily
 */
async function daily(req, res, next) {
  try {
    const { date } = req.query;
    const report = await reportsService.getDailyReport(req.user.id, date);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/month-to-date
 */
async function monthToDate(req, res, next) {
  try {
    const { date } = req.query;
    const report = await reportsService.getMonthToDateReport(req.user.id, date);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/monthly
 */
async function monthly(req, res, next) {
  try {
    const { date } = req.query;
    const report = await reportsService.getMonthlyReport(req.user.id, date);
    res.json(report);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  daily,
  monthToDate,
  monthly,
};
