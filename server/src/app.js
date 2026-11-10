const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');

/**
 * Build and configure the Express application.
 * Exported separately from server.js to enable testing without listening on a port.
 */
function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: env.clientOrigin,
    credentials: true,
  }));

  // Parse JSON
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/readings', require('./routes/readings.routes'));
  // TODO: Add reports routes
  // app.use('/api/reports', reportsRoutes);

  // 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });

  // Central error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
