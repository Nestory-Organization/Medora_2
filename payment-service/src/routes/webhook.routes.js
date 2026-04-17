const express = require('express');
const { handleWebhook } = require('../controllers/payment.controller');
const { stripeWebhookMiddleware } = require('../middleware/stripe-webhook.middleware');

const router = express.Router();

// Webhook endpoint - does not require auth, only Stripe signature verification
router.post('/', stripeWebhookMiddleware, handleWebhook);

module.exports = router;
