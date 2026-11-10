const readingsService = require('../services/readings.service');

/**
 * Readings controller - handles HTTP request/response for readings endpoints.
 */

/**
 * POST /api/readings
 */
async function create(req, res, next) {
  try {
    const { date, slot, value } = req.body;
    const reading = await readingsService.createReading(req.user.id, date, slot, value);
    res.status(201).json({ reading });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/readings
 */
async function list(req, res, next) {
  try {
    const { date, page, limit } = req.query;
    const result = await readingsService.listReadings(req.user.id, { date, page, limit });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/readings/:id
 */
async function getOne(req, res, next) {
  try {
    const reading = await readingsService.getReading(req.user.id, req.params.id);
    res.json({ reading });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/readings/:id
 */
async function update(req, res, next) {
  try {
    const { date, slot, value } = req.body;
    const reading = await readingsService.updateReading(
      req.user.id,
      req.params.id,
      date,
      slot,
      value
    );
    res.json({ reading });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/readings/:id
 */
async function remove(req, res, next) {
  try {
    await readingsService.deleteReading(req.user.id, req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
};
