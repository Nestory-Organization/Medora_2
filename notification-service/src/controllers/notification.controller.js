const {
  sendEmail,
  sendSms,
  notifyByEvent,
  NotificationValidationError
} = require('../services/notification.service');

const notifyEmail = async (req, res) => {
  try {
    const result = await sendEmail(req.body || {});

    return res.status(200).json({
      success: true,
      message: 'Email notification processed',
      data: result
    });
  } catch (error) {
    if (error instanceof NotificationValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    console.error('notifyEmail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process email notification',
      data: null
    });
  }
};

const notifySms = async (req, res) => {
  try {
    const result = await sendSms(req.body || {});

    return res.status(200).json({
      success: true,
      message: 'SMS notification processed',
      data: result
    });
  } catch (error) {
    if (error instanceof NotificationValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    console.error('notifySms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process SMS notification',
      data: null
    });
  }
};

const notifyEvent = async (req, res) => {
  try {
    const result = await notifyByEvent(req.body || {});

    return res.status(200).json({
      success: true,
      message: 'Event notification processed',
      data: result
    });
  } catch (error) {
    if (error instanceof NotificationValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    console.error('notifyEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process event notification',
      data: null
    });
  }
};

module.exports = {
  notifyEmail,
  notifySms,
  notifyEvent
};
