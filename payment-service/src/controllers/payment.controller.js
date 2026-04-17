const {
  createPaymentSession,
  processWebhook,
  confirmPaymentBySessionId,
  reconcilePaymentByAppointmentId,
  PaymentValidationError,
  PaymentNotFoundError,
  getDoctorEarnings,
  getAllDoctorEarnings
} = require('../services/payment.service');

const createSession = async (req, res) => {
  try {
    const result = await createPaymentSession(req.body || {});

    return res.status(201).json({
      success: true,
      message: 'Payment session created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create payment session error:', error);

    if (error instanceof PaymentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create payment session',
      data: null
    });
  }
};

const handleWebhook = async (req, res) => {
  try {
    // Get the Stripe event from the middleware
    const event = req.stripeEvent;
    
    if (!event) {
      return res.status(400).json({
        success: false,
        message: 'No stripe event found',
        data: null
      });
    }

    const payment = await processWebhook(event);

    return res.status(200).json({
      success: true,
      message: 'Payment webhook processed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Payment webhook error:', error);

    if (error instanceof PaymentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof PaymentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to process payment webhook',
      data: null
    });
  }
};

const confirmSessionPayment = async (req, res) => {
  try {
    const sessionId = req.body?.sessionId;

    const payment = await confirmPaymentBySessionId(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Payment session confirmed successfully',
      data: payment
    });
  } catch (error) {
    console.error('Confirm payment session error:', error);

    if (error instanceof PaymentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof PaymentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to confirm payment session',
      data: null
    });
  }
};

const reconcileAppointmentPayment = async (req, res) => {
  try {
    const appointmentId = req.params?.appointmentId;

    const payment = await reconcilePaymentByAppointmentId(appointmentId);

    return res.status(200).json({
      success: true,
      message: 'Payment reconciliation completed',
      data: payment
    });
  } catch (error) {
    console.error('Reconcile appointment payment error:', error);

    if (error instanceof PaymentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof PaymentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to reconcile appointment payment',
      data: null
    });
  }
};

const getDoctorEarningsHandler = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { startDate, endDate, period = 'day' } = req.query;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required',
        data: null
      });
    }

    const earnings = await getDoctorEarnings(doctorId, {
      startDate,
      endDate,
      period
    });

    return res.status(200).json({
      success: true,
      message: 'Doctor earnings retrieved successfully',
      data: earnings
    });
  } catch (error) {
    console.error('Get doctor earnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctor earnings',
      data: null
    });
  }
};

const getAllDoctorEarningsHandler = async (req, res) => {
  try {
    const { startDate, endDate, period = 'day' } = req.query;

    const earnings = await getAllDoctorEarnings({
      startDate,
      endDate,
      period
    });

    return res.status(200).json({
      success: true,
      message: 'All doctor earnings retrieved successfully',
      data: earnings
    });
  } catch (error) {
    console.error('Get all doctor earnings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve all doctor earnings',
      data: null
    });
  }
};

module.exports = {
  createSession,
  handleWebhook,
  confirmSessionPayment,
  reconcileAppointmentPayment,
  getDoctorEarningsHandler,
  getAllDoctorEarningsHandler
};
