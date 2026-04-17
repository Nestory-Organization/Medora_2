const {
  createPaymentSession,
  processWebhook,
  PaymentValidationError,
  PaymentNotFoundError
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

module.exports = {
  createSession,
  handleWebhook
};
