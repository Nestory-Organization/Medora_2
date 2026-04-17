const { stripe } = require('../config/stripe');
const env = require('../config/env');

const stripeWebhookMiddleware = (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig || !env.stripeWebhookSecret) {
    console.warn('Stripe webhook: Missing signature or webhook secret');
    return res.status(400).json({ received: false });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.rawBody || req.body,
      sig,
      env.stripeWebhookSecret
    );

    req.stripeEvent = event;
    next();
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error.message);
    return res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
};

module.exports = {
  stripeWebhookMiddleware
};
