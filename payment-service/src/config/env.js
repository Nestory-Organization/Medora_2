const dotenv = require('dotenv');

dotenv.config();

const defaultAppointmentServiceUrl =
  process.env.NODE_ENV === 'production'
    ? 'http://appointment-service:4004'
    : 'http://localhost:4004';

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
  serviceName: process.env.SERVICE_NAME || 'payment-service',
  internalApiKey: process.env.INTERNAL_API_KEY || '',
  payHereSandbox: process.env.PAYHERE_SANDBOX,
  payHereMerchantId: process.env.PAYHERE_MERCHANT_ID,
  payHereReturnUrl: process.env.PAYHERE_RETURN_URL,
  payHereCancelUrl: process.env.PAYHERE_CANCEL_URL,
  payHereNotifyUrl: process.env.PAYHERE_NOTIFY_URL,
  payHereCheckoutUrl: process.env.PAYHERE_CHECKOUT_URL,
  appointmentServiceUrl:
    process.env.APPOINTMENT_SERVICE_URL || defaultAppointmentServiceUrl,
  notificationServiceUrl:
    process.env.NOTIFICATION_SERVICE_URL || defaultNotificationServiceUrl,
  serviceRequestTimeoutMs: Number(process.env.SERVICE_REQUEST_TIMEOUT_MS || 5000)
};

