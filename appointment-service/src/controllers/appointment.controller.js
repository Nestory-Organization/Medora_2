const {
  createAppointment,
  AppointmentValidationError,
  AppointmentConflictError
} = require('../services/appointment.service');

const bookAppointment = async (req, res) => {
  try {
    const appointment = await createAppointment(req.body || {});

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Book appointment error:', error);

    if (error instanceof AppointmentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof AppointmentConflictError) {
      return res.status(409).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      data: null
    });
  }
};

module.exports = {
  bookAppointment
};