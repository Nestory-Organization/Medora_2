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

const ensureAppointmentEligibleForPayment = async (appointmentId) => {
  const baseUrl = String(env.appointmentServiceUrl || '').replace(/\/$/, '');
  if (!baseUrl) {
    throw new PaymentValidationError('Appointment service URL is not configured');
  }

  const targetUrl =
    baseUrl +
    '/appointments/' +
    encodeURIComponent(String(appointmentId).trim()) +
    '/payment-eligibility';

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.serviceRequestTimeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new PaymentValidationError('Unable to verify appointment status for payment');
    }

    const payload = await response.json();
    const eligible = payload?.data?.eligible === true;

    if (!eligible) {
      throw new PaymentValidationError(
        payload?.data?.reason || 'Payment is allowed only after appointment acceptance'
      );
    }
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      throw error;
    }

    throw new PaymentValidationError(
      error.name === 'AbortError'
        ? 'Timed out while verifying appointment payment eligibility'
        : 'Unable to verify appointment eligibility for payment'
    );
  } finally {
    clearTimeout(timeout);
  }
};

const createPaymentSession = async (payload) => {
  validateCreateSessionPayload(payload);

  if (process.env.MOCK_PAYMENTS !== 'true') {
    await ensureAppointmentEligibleForPayment(payload.appointmentId);
  }

  const mockPayments = process.env.MOCK_PAYMENTS === 'true';
  const created = await Payment.create({
    appointmentId: payload.appointmentId.trim(),
    patientId: payload.patientId.trim(),
    amount: payload.amount,
    currency: payload.currency.trim().toUpperCase(),
    gateway: mockPayments ? 'MOCK' : gatewayName,
    status: 'PENDING'
  });

  console.log('Created', mockPayments ? 'MOCK' : gatewayName, 'payment:', created._id);

  if (mockPayments) {
    console.log('[Mock Payment] Simulating successful payment for appointment:', payload.appointmentId);

    created.status = 'SUCCESS';
    created.transactionId = `mock_session_${Date.now()}`;
    await created.save();

    const syncResult = await updateAppointmentFromPayment({
      appointmentId: payload.appointmentId,
      paymentStatus: 'SUCCESS'
    });
    console.log('[Mock Payment] Appointment sync result:', JSON.stringify(syncResult));

    return {
      paymentId: created._id,
      sessionId: created.transactionId,
      checkoutUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/payment-success?session_id=${created.transactionId}`,
      status: 'SUCCESS',
      amount: created.amount,
      currency: created.currency,
      gateway: 'MOCK',
      isMock: true
    };
  }

  try {
    const amountInCents = Math.round(payload.amount * 100);
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

// Get doctor earnings from completed appointments
const getDoctorEarnings = async (doctorId, options = {}) => {
  const { startDate, endDate, period = 'day' } = options;
  
  // Build date filter for payments
  const matchFilter = { status: 'SUCCESS' };
  
  if (startDate) {
    matchFilter.createdAt = { $gte: new Date(startDate) };
  }
  if (endDate) {
    matchFilter.createdAt = { ...matchFilter.createdAt, $lte: new Date(endDate + 'T23:59:59') };
  }

  // Get payments for this doctor - query appointments collection to get doctorId
  const earnings = await Payment.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: 'appointments',
        localField: 'appointmentId',
        foreignField: '_id',
        as: 'appointment'
      }
    },
    { $unwind: '$appointment' },
    { $match: { 'appointment.doctorId': doctorId } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: 'UTC'
          }
        },
        totalEarnings: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        appointmentIds: { $push: '$appointmentId' }
      }
    },
    { $sort: { _id: -1 } }
]);

  // If no earnings data, try getting from appointments directly
  if (earnings.length === 0) {
    const Appointment = require('../models/appointment.model');
    const appointmentFilter = { 
      doctorId: doctorId,
      paymentStatus: 'PAID',
      status: { $in: ['CONFIRMED', 'COMPLETED'] }
    };
    
    if (startDate || endDate) {
      appointmentFilter.appointmentDate = {};
      if (startDate) appointmentFilter.appointmentDate.$gte = new Date(startDate);
      if (endDate) appointmentFilter.appointmentDate.$lte = new Date(endDate);
    }
    
    const completedAppts = await Appointment.find(appointmentFilter).lean();
    
    // Group by date
    const byDate = {};
    for (const apt of completedAppts) {
      const dateKey = new Date(apt.appointmentDate).toISOString().split('T')[0];
      if (!byDate[dateKey]) {
        byDate[dateKey] = { earnings: 0, appointments: 0, ids: [] };
      }
      byDate[dateKey].earnings += apt.consultationFee || 0;
      byDate[dateKey].appointments += 1;
      byDate[dateKey].ids.push(apt._id);
    }
    
    for (const [date, data] of Object.entries(byDate)) {
      earnings.push({
        _id: date,
        totalEarnings: data.earnings,
        totalTransactions: data.appointments,
        appointmentIds: data.ids
      });
    }
    earnings.sort((a, b) => b._id.localeCompare(a._id));
  }

  const totalEarnings = earnings.reduce((sum, day) => sum + day.totalEarnings, 0);
  const totalAppointments = earnings.reduce((sum, day) => sum + day.totalTransactions, 0);

  return {
    doctorId,
    period,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    summary: {
      totalEarnings,
      totalAppointments,
      averagePerAppointment: totalAppointments > 0 ? (totalEarnings / totalAppointments).toFixed(2) : 0
    },
    dailyEarnings: earnings.map(day => ({
      date: day._id,
      earnings: day.totalEarnings,
      appointments: day.totalTransactions,
      appointmentIds: day.appointmentIds
    }))
  };
};

const getAllDoctorEarnings = async (options = {}) => {
  const { startDate, endDate, period = 'day' } = options;

  // Build date filter
  const dateFilter = {};
  if (startDate) {
    dateFilter.$gte = new Date(startDate);
  }
  if (endDate) {
    dateFilter.$lte = new Date(endDate);
  }

  // Get all successful payments with transaction data
  const payments = await Payment.aggregate([
    {
      $match: {
        status: 'SUCCESS',
        createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
      }
    },
    {
      $lookup: {
        from: 'transactions',
        let: { appointmentId: '$appointmentId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$appointmentId', '$$appointmentId'] },
              status: 'completed'
            }
          }
        ],
        as: 'transaction'
      }
    },
    {
      $match: { transaction: { $ne: [] } }
    },
    {
      $unwind: '$transaction'
    }
  ]);

  // Group by doctor and date
  const earningsByDoctor = {};
  const doctorStats = {};

  payments.forEach(payment => {
    const doctorId = payment.transaction.doctorId;
    const date = new Date(payment.createdAt).toISOString().split('T')[0];

    if (!earningsByDoctor[doctorId]) {
      earningsByDoctor[doctorId] = {};
      doctorStats[doctorId] = {
        totalEarnings: 0,
        totalAppointments: 0
      };
    }

    if (!earningsByDoctor[doctorId][date]) {
      earningsByDoctor[doctorId][date] = {
        earnings: 0,
        appointments: 0,
        appointmentIds: []
      };
    }

    earningsByDoctor[doctorId][date].earnings += payment.amount;
    earningsByDoctor[doctorId][date].appointments += 1;
    earningsByDoctor[doctorId][date].appointmentIds.push(payment.appointmentId);

    doctorStats[doctorId].totalEarnings += payment.amount;
    doctorStats[doctorId].totalAppointments += 1;
  });

  // Format results
  const result = [];
  for (const [doctorId, dailyData] of Object.entries(earningsByDoctor)) {
    const stats = doctorStats[doctorId];
    const dailyEarnings = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        earnings: data.earnings,
        appointments: data.appointments,
        appointmentIds: data.appointmentIds
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    result.push({
      doctorId,
      summary: {
        totalEarnings: stats.totalEarnings,
        totalAppointments: stats.totalAppointments,
        averagePerAppointment: stats.totalAppointments > 0 ? (stats.totalEarnings / stats.totalAppointments).toFixed(2) : 0
      },
      dailyEarnings
    });
  }

  return {
    period,
    dateRange: {
      startDate: startDate || null,
      endDate: endDate || null
    },
    totalDoctors: result.length,
    doctors: result.sort((a, b) => b.summary.totalEarnings - a.summary.totalEarnings)
  };
};

module.exports = {
  createPaymentSession,
  processWebhook,
  PaymentValidationError,
  PaymentNotFoundError,
  getDoctorEarnings,
  getAllDoctorEarnings
};
