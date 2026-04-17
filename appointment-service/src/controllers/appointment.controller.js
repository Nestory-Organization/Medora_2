const {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  updateAppointmentPaymentState,
  AppointmentValidationError,
  AppointmentConflictError,
  AppointmentNotFoundError
} = require('../services/appointment.service');
const { bookAppointmentWithValidation } = require('./appointmentManagement.controller');

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

const modifyAppointment = async (req, res) => {
  try {
    const appointment = await updateAppointment(req.params.id, req.body || {});

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Modify appointment error:', error);

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

    if (error instanceof AppointmentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      data: null
    });
  }
};

const cancelAppointmentById = async (req, res) => {
  try {
    const appointment = await cancelAppointment(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);

    if (error instanceof AppointmentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof AppointmentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      data: null
    });
  }
};

const updateAppointmentPaymentStatusById = async (req, res) => {
  try {
    console.log('[Payment Status Update] Request received:', {
      appointmentId: req.params.id,
      body: req.body
    });

    const appointment = await updateAppointmentPaymentState(
      req.params.id,
      req.body || {}
    );

    console.log('[Payment Status Update] Success:', {
      appointmentId: req.params.id,
      newStatus: appointment.status,
      newPaymentStatus: appointment.paymentStatus
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment payment state updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('[Payment Status Update] Error:', {
      appointmentId: req.params.id,
      error: error.message,
      stack: error.stack
    });

    if (error instanceof AppointmentValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    if (error instanceof AppointmentNotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        data: null
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment payment state',
      data: null
    });
  }
};

module.exports = {
  bookAppointment,
  modifyAppointment,
  cancelAppointmentById,
  updateAppointmentPaymentStatusById
};