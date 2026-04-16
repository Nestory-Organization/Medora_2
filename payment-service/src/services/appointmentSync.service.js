const env = require('../config/env');

const updateAppointmentFromPayment = async ({ appointmentId, paymentStatus }) => {
  const normalizedPaymentStatus = String(paymentStatus || '').toUpperCase();

  if (!['SUCCESS', 'FAILED'].includes(normalizedPaymentStatus)) {
    return { skipped: true, reason: 'No appointment sync required for this status' };
  }

  const endpoint =
    env.appointmentServiceUrl.replace(/\/$/, '') +
    '/appointments/' +
    encodeURIComponent(String(appointmentId)) +
    '/payment-status';

  const body =
    normalizedPaymentStatus === 'SUCCESS'
      ? { paymentStatus: 'PAID', status: 'CONFIRMED' }
      : { paymentStatus: 'FAILED' };

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.serviceRequestTimeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    let responseBody = null;
    try {
      responseBody = await response.json();
    } catch (parseError) {
      responseBody = null;
    }

    if (!response.ok) {
      return {
        skipped: false,
        success: false,
        statusCode: response.status,
        error:
          responseBody?.message ||
          'Appointment-service returned a non-success response'
      };
    }

    return {
      skipped: false,
      success: true,
      statusCode: response.status,
      data: responseBody?.data || null
    };
  } catch (error) {
    return {
      skipped: false,
      success: false,
      statusCode: null,
      error:
        error.name === 'AbortError'
          ? 'Request timed out while calling appointment-service'
          : error.message
    };
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  updateAppointmentFromPayment
};
