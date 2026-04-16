const dotenv = require('dotenv');

dotenv.config();

const defaultNotificationServiceUrl =
  process.env.NODE_ENV === 'production'
    ? 'http://notification-service:4006'
    : 'http://localhost:4006';

const requiredVars = ['PORT', 'MONGO_URI'];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error('Missing required environment variable: ' + key);
  }
});

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  serviceName: process.env.SERVICE_NAME || 'appointment-service',
  doctorSearchSource: process.env.DOCTOR_SEARCH_SOURCE || 'mock',
  doctorServiceUrl: process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:4003',
  notificationServiceUrl:
    process.env.NOTIFICATION_SERVICE_URL || defaultNotificationServiceUrl,
  serviceRequestTimeoutMs: Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 5000)
};

