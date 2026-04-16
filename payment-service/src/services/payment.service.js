const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const payHereConfig = require('../config/payhere');
const { updateAppointmentFromPayment } = require('./appointmentSync.service');

class PaymentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentValidationError';
    this.statusCode = 400;
  }
}

class PaymentNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PaymentNotFoundError';
    this.statusCode = 404;
  }
}

const requiredCreateFields = ['appointmentId', 'patientId', 'amount', 'currency'];

const mapPayment = (payment) => ({
  paymentId: payment._id,
  appointmentId: payment.appointmentId,
  patientId: payment.patientId,
  amount: payment.amount,
  currency: payment.currency,
  gateway: payment.gateway,
  transactionId: payment.transactionId,
  status: payment.status,
  paymentMethod: payment.paymentMethod,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
});

const validateCreateSessionPayload = (payload) => {
  const missingFields = requiredCreateFields.filter((field) => {
    const value = payload[field];

    if (value === undefined || value === null) {
      return true;
    }

    if (typeof value === 'string' && !value.trim()) {
      return true;
    }

    return false;
  });

  if (missingFields.length > 0) {
    throw new PaymentValidationError(
      'Missing required fields: ' + missingFields.join(', ')
    );
  }

  if (typeof payload.amount !== 'number' || payload.amount <= 0) {
    throw new PaymentValidationError('amount must be a positive number');
  }

  if (typeof payload.currency !== 'string' || !/^[A-Za-z]{3}$/.test(payload.currency)) {
    throw new PaymentValidationError('currency must be a valid 3-letter currency code');
  }
};

const validateWebhookPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new PaymentValidationError('Webhook payload is required');
  }

  const statusCode = payload.status_code ?? payload.statusCode;

  if (statusCode === undefined || statusCode === null || statusCode === '') {
    throw new PaymentValidationError('Webhook payload must include status_code');
  }
};

const buildPayHereSession = (payment, payload) => ({
  sandbox: payHereConfig.sandbox,
  checkoutUrl: payHereConfig.checkoutUrl,
  method: 'POST',
  formFields: {
    merchant_id: payHereConfig.merchantId || 'PAYHERE_SANDBOX_MERCHANT_ID',
    return_url: payHereConfig.returnUrl || 'http://localhost:5173/payment/success',
    cancel_url: payHereConfig.cancelUrl || 'http://localhost:5173/payment/cancel',
    notify_url:
      payHereConfig.notifyUrl || 'http://localhost:4005/payment/webhook',
    order_id: String(payment._id),
    items: payload.description || 'Appointment Payment - ' + payment.appointmentId,
    currency: payment.currency,
    amount: payment.amount.toFixed(2),
    custom_1: payment.appointmentId,
    custom_2: payment.patientId
  }
});

const createPaymentSession = async (payload) => {
  validateCreateSessionPayload(payload);

  const created = await Payment.create({
    appointmentId: payload.appointmentId.trim(),
    patientId: payload.patientId.trim(),
    amount: payload.amount,
    currency: payload.currency.trim().toUpperCase(),
    gateway: payHereConfig.gatewayName,
    status: 'PENDING',
    paymentMethod:
      typeof payload.paymentMethod === 'string' && payload.paymentMethod.trim()
        ? payload.paymentMethod.trim()
        : null
  });

  return {
    payment: mapPayment(created),
    session: buildPayHereSession(created, payload)
  };
};

const findPaymentForWebhook = async (payload) => {
  const orderId = payload.order_id || payload.orderId || payload.payment_reference;
  const appointmentId =
    payload.custom_1 || payload.appointmentId || payload.appointment_id;

  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const byId = await Payment.findById(orderId);

    if (byId) {
      return byId;
    }
  }

  if (appointmentId) {
    const byAppointment = await Payment.findOne({
      appointmentId: String(appointmentId).trim()
    }).sort({ createdAt: -1 });

    if (byAppointment) {
      return byAppointment;
    }
  }

  return null;
};

const processWebhook = async (payload) => {
  validateWebhookPayload(payload);

  const payment = await findPaymentForWebhook(payload);

  if (!payment) {
    throw new PaymentNotFoundError('Payment record not found for webhook payload');
  }

  const nextStatus = payHereConfig.mapWebhookStatusCode(
    payload.status_code ?? payload.statusCode
  );

  if (!nextStatus) {
    throw new PaymentValidationError('Unsupported status_code in webhook payload');
  }

  const transactionId = payload.payment_id || payload.transactionId;

  payment.status = nextStatus;
  payment.webhookPayload = payload;

  if (transactionId) {
    payment.transactionId = String(transactionId);
  }

  const webhookPaymentMethod =
    payload.method || payload.payment_method || payload.card_holder_name;

  if (webhookPaymentMethod && typeof webhookPaymentMethod === 'string') {
    payment.paymentMethod = webhookPaymentMethod.trim();
  }

  const updated = await payment.save();

  if (['SUCCESS', 'FAILED'].includes(updated.status)) {
    const syncResult = await updateAppointmentFromPayment({
      appointmentId: updated.appointmentId,
      paymentStatus: updated.status
    });

    if (!syncResult.success && !syncResult.skipped) {
      console.error('Appointment-service sync failed:', {
        appointmentId: updated.appointmentId,
        paymentStatus: updated.status,
        statusCode: syncResult.statusCode,
        error: syncResult.error
      });
    }

    if (updated.status === 'SUCCESS') {
      // Future inter-service communication: publish payment-success event to notification-service.
    }

    if (updated.status === 'FAILED') {
      // Future inter-service communication: publish payment-failure event to notification-service.
    }
  }

  if (updated.status === 'REFUNDED') {
    // Future inter-service communication: notify appointment-service to reflect refunded payment state.
    // Future inter-service communication: publish payment-refunded event to notification-service.
  }

  return mapPayment(updated);
};

module.exports = {
  createPaymentSession,
  processWebhook,
  PaymentValidationError,
  PaymentNotFoundError
};
