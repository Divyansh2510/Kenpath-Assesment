const createApp = require('./app');
const env = require('./config/env');

const app = createApp();

app.listen(env.port, () => {
  console.log(`🩸 Sweety server running on port ${env.port}`);
  console.log(`📊 Environment: ${env.nodeEnv}`);
  console.log(`🌍 Client origin: ${env.clientOrigin}`);
});
