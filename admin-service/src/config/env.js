const dotenv = require('dotenv');

dotenv.config();

const requiredVars = ['PORT', 'MONGO_URI', 'JWT_SECRET'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error('Missing required environment variable: ' + key);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3006,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  serviceName: process.env.SERVICE_NAME || 'admin-service'
};
