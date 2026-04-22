const Stripe = require('stripe');
const env = require('./env');

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: '2023-10-16' })
  : null;

module.exports = {
  stripe,
  publishableKey: env.stripePublishableKey || '',
  webhookSecret: env.stripeWebhookSecret,
  gatewayName: 'STRIPE'
};
