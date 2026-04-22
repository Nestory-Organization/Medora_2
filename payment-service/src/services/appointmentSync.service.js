const env = require('../config/env');

const updateAppointmentFromPayment = async ({ appointmentId, paymentStatus }) => {
  const normalizedPaymentStatus = String(paymentStatus || '').toUpperCase();

  if (!['SUCCESS', 'FAILED'].includes(normalizedPaymentStatus)) {
    return {
      skipped: true,
      success: false,
      reason: 'No appointment sync required for this status'
    };
  }

  if (!appointmentId || !String(appointmentId).trim()) {
    return {
      skipped: false,
      success: false,
      statusCode: null,
      targetUrl: null,
      error: 'appointmentId is required for appointment sync'
    };
  }

  const targetUrl =
    env.appointmentServiceUrl.replace(/\/$/, '') +
    '/appointments/' +
    encodeURIComponent(String(appointmentId)) +
    '/payment-status';

  const body =
    normalizedPaymentStatus === 'SUCCESS'
      ? { paymentStatus: 'PAID', status: 'CONFIRMED' }
      : { paymentStatus: 'FAILED' };

  console.log('[Appointment Sync] Calling:', targetUrl, 'with body:', JSON.stringify(body));

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.serviceRequestTimeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    let responseBody = null;
    try {
      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
    } catch (parseError) {
      responseBody = null;
    }

    console.log('[Appointment Sync] Response status:', response.status, 'Body:', JSON.stringify(responseBody));

    if (!response.ok) {
      console.error('[Appointment Sync] Error response from appointment-service:', JSON.stringify(responseBody));

      if (normalizedPaymentStatus === 'SUCCESS') {
        console.log('[Appointment Sync] Trying fallback: update paymentStatus only');
        const fallbackUrl =
          env.appointmentServiceUrl.replace(/\/$/, '') +
          '/appointments/' +
          encodeURIComponent(String(appointmentId)) +
          '/payment-status';

        const fallbackResponse = await fetch(fallbackUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ paymentStatus: 'PAID' }),
          signal: controller.signal
        });

        console.log('[Appointment Sync] Fallback response status:', fallbackResponse.status);

        if (fallbackResponse.ok) {
          console.log('[Appointment Sync] Fallback succeeded - payment marked as PAID');
          return {
            skipped: false,
            success: true,
            statusCode: fallbackResponse.status,
            targetUrl: fallbackUrl,
            data: null
          };
        }
      }

      return {
        skipped: false,
        success: false,
        statusCode: response.status,
        targetUrl,
        responseBody,
        error:
          (typeof responseBody === 'object' && responseBody?.message) ||
          `Appointment-service returned ${response.status}`
      };
    }

    console.log('[Appointment Sync] Successfully synced appointment status');
    return {
      skipped: false,
      success: true,
      statusCode: response.status,
      targetUrl,
      data:
        typeof responseBody === 'object' && responseBody !== null
          ? responseBody?.data || null
          : null
    };
  } catch (error) {
    console.error('[Appointment Sync] Fetch error:', error.message);
    return {
      skipped: false,
      success: false,
      statusCode: null,
      targetUrl,
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
