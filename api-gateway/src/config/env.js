const dotenv = require('dotenv');

dotenv.config();

const requiredVars = [
  'PORT',
  'AUTH_SERVICE_URL',
  'PATIENT_SERVICE_URL',
  'DOCTOR_SERVICE_URL',
  'APPOINTMENT_SERVICE_URL',
  'PAYMENT_SERVICE_URL',
  'NOTIFICATION_SERVICE_URL',
  'AI_SERVICE_URL',
  'ADMIN_SERVICE_URL'
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error('Missing required environment variable: ' + key);
  }
});

module.exports = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || 'development',
  authServiceUrl: process.env.AUTH_SERVICE_URL,
  patientServiceUrl: process.env.PATIENT_SERVICE_URL,
  doctorServiceUrl: process.env.DOCTOR_SERVICE_URL,
  appointmentServiceUrl: process.env.APPOINTMENT_SERVICE_URL,
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL,
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
  aiServiceUrl: process.env.AI_SERVICE_URL,
  adminServiceUrl: process.env.ADMIN_SERVICE_URL
};

