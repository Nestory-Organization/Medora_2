const app = require('./app');
const env = require('./config/env');
const connectDatabase = require('./config/database');

const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.info(`Admin Service running on port ${env.port} in ${env.nodeEnv} mode`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
