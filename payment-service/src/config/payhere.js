const env = require('./env');

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return String(value).toLowerCase() === 'true';
};

const mapWebhookStatusCode = (value) => {
  const normalized = Number(value);

  if (normalized === 2) {
    return 'SUCCESS';
  }

  if (normalized === 0) {
    return 'PENDING';
  }

  if (normalized === -3) {
    return 'REFUNDED';
  }

  if (Number.isNaN(normalized)) {
    return null;
  }

  return 'FAILED';
};

module.exports = {
  gatewayName: 'PAYHERE',
  sandbox: parseBoolean(env.payHereSandbox, true),
  merchantId: env.payHereMerchantId,
  checkoutUrl:
    env.payHereCheckoutUrl ||
    (parseBoolean(env.payHereSandbox, true)
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout'),
  returnUrl: env.payHereReturnUrl,
  cancelUrl: env.payHereCancelUrl,
  notifyUrl: env.payHereNotifyUrl,
  mapWebhookStatusCode
};
