const Stripe = require('stripe');
const env = require('./env');

const stripe = new Stripe(env.stripeSecretKey, {
  apiVersion: '2023-10-16'
});

module.exports = {
  stripe,
  publishableKey: env.stripePublishableKey,
  webhookSecret: env.stripeWebhookSecret,
  gatewayName: 'STRIPE'
};
