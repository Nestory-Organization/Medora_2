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
  authServiceUrl:
    process.env.AUTH_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://auth-service:4001' : 'http://localhost:4001'),
  doctorServiceUrl:
    process.env.DOCTOR_SERVICE_URL ||
    (process.env.NODE_ENV === 'production' ? 'http://doctor-service:4003' : 'http://localhost:4003'),
  paymentServiceUrl:
    process.env.PAYMENT_SERVICE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'http://payment-service:4005'
      : 'http://localhost:4005'),
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  serviceRequestTimeoutMs: Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 8000),
  serviceName: process.env.SERVICE_NAME || 'admin-service'
};
