const mongoose = require('mongoose');
const Payment = require('../models/payment.model');
const { stripe, gatewayName } = require('../config/stripe');
const env = require('../config/env');
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

const publishNotificationEvent = async (eventType, payload) => {
  const baseUrl = String(env.notificationServiceUrl || '').replace(/\/$/, '');

  if (!baseUrl) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.serviceRequestTimeoutMs);

  try {
    const response = await fetch(baseUrl + '/notify/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        ...payload
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error('notification-service event publish failed:', {
        eventType,
        statusCode: response.status
      });
    }
  } catch (error) {
    console.error('notification-service event publish error:', {
      eventType,
      error: error.name === 'AbortError' ? 'Request timed out' : error.message
    });
  } finally {
    clearTimeout(timeout);
  }
};

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

  const type = payload.type;

  if (!type) {
    throw new PaymentValidationError('Webhook payload must include type field');
  }
};

const createPaymentSession = async (payload) => {
  validateCreateSessionPayload(payload);

  const created = await Payment.create({
    appointmentId: payload.appointmentId.trim(),
    patientId: payload.patientId.trim(),
    amount: payload.amount,
    currency: payload.currency.trim().toUpperCase(),
    gateway: gatewayName,
    status: 'PENDING'
  });

  console.log('Created', gatewayName, 'payment:', created._id);

  try {
    // Convert amount to cents for Stripe
    const amountInCents = Math.round(payload.amount * 100);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: payload.currency.toLowerCase(),
            product_data: {
              name: `Appointment Payment - ${payload.appointmentId}`,
              description: `Medical consultation fee`
            },
            unit_amount: amountInCents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/payment-cancel`,
      metadata: {
        paymentId: created._id.toString(),
        appointmentId: payload.appointmentId,
        patientId: payload.patientId
      },
      client_reference_id: created._id.toString()
    });

    // Update payment with Stripe session ID
    created.transactionId = session.id;
    await created.save();

    console.log('Stripe checkout session created:', session.id);

    return {
      paymentId: created._id,
      sessionId: session.id,
      checkoutUrl: session.url,
      status: 'PENDING',
      amount: created.amount,
      currency: created.currency,
      gateway: gatewayName
    };
  } catch (error) {
    console.error('Error creating Stripe session:', error);
    created.status = 'FAILED';
    created.errorMessage = error.message;
    await created.save();
    throw new PaymentValidationError('Failed to create payment session: ' + error.message);
  }
};

const processWebhook = async (payload) => {
  validateWebhookPayload(payload);

  const type = payload.type;
  const data = payload.data?.object;

  if (!data) {
    throw new PaymentValidationError('Invalid webhook payload structure');
  }

  // Extract payment ID from metadata or client reference
  const paymentId = data.metadata?.paymentId || data.client_reference_id;

  if (!paymentId) {
    console.warn('Webhook: Unable to map payment ID from event', { type });
    return null;
  }

  let payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new PaymentNotFoundError(`Payment ${paymentId} not found`);
  }

  // Map Stripe events to payment status
  let newStatus = payment.status;

  if (type === 'checkout.session.completed') {
    newStatus = 'SUCCESS';
    payment.paymentMethod = data.payment_method_types?.[0] || 'card';
    if (data.payment_intent) {
      payment.transactionId = data.payment_intent;
    }
  } else if (type === 'charge.refunded') {
    newStatus = 'REFUNDED';
  } else if (type === 'charge.dispute.created') {
    newStatus = 'DISPUTED';
  } else if (type === 'charge.failed') {
    newStatus = 'FAILED';
  }

  payment.status = newStatus;
  payment.webhookPayload = payload;
  const updated = await payment.save();

  console.log('Payment', paymentId, 'status updated to:', newStatus);

  // Sync with appointment service on successful payment
  if (newStatus === 'SUCCESS') {
    try {
      console.log('[Appointment Sync] Syncing payment status for appointment:', updated.appointmentId);
      const syncResult = await updateAppointmentFromPayment({
        appointmentId: updated.appointmentId,
        paymentStatus: newStatus
      });
      console.log('[Appointment Sync] Result:', JSON.stringify(syncResult, null, 2));
    } catch (error) {
      console.error('[Appointment Sync] Error updating appointment from payment:', error.message);
    }
  }

  // Publish notification events
  try {
    const eventType = newStatus === 'SUCCESS' ? 'PAYMENT_SUCCESS' : `PAYMENT_${newStatus}`;
    await publishNotificationEvent(eventType, {
      paymentId: String(updated._id),
      appointmentId: updated.appointmentId,
      patientId: updated.patientId,
      amount: updated.amount,
      currency: updated.currency,
      transactionId: updated.transactionId,
      metadata: {
        gateway: updated.gateway,
        paymentMethod: updated.paymentMethod
      }
    });
  } catch (error) {
    console.error('Error publishing notification event:', error.message);
  }

  return mapPayment(updated);
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

module.exports = {
  createPaymentSession,
  processWebhook,
  PaymentValidationError,
  PaymentNotFoundError
};
