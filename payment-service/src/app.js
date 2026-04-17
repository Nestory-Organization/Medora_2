const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const systemRoutes = require('./routes/system.routes');
const internalRoutes = require('./routes/internal.routes');
const paymentRoutes = require('./routes/payment.routes');
const webhookRoutes = require('./routes/webhook.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());

// Store raw body for Stripe webhook signature verification
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use('/', systemRoutes);
app.use('/internal', internalRoutes);
app.use('/payment', paymentRoutes);
// Webhook endpoint accessible at both /webhook and /payment/webhook
app.use('/webhook', webhookRoutes);
app.use('/payment/webhook', webhookRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: null
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null
  });
});

module.exports = app;

