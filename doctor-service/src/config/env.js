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
  port: Number(process.env.PORT),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  serviceName: process.env.SERVICE_NAME || 'doctor-service',
  patientServiceUrl: process.env.PATIENT_SERVICE_URL || 'http://localhost:4002',
  appointmentServiceUrl: process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:4004',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4006',
  serviceRequestTimeoutMs: Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 8000)
};

