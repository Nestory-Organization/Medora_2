/**
 * Enhanced Patient Appointment Management Controller
 * Integrates with Doctor Service for availability validation
 */

const mongoose = require('mongoose');
const {
  validateAppointmentSlotAvailability,
  markSlotAsBooked,
  releaseBookedSlot,
  AvailabilityValidationError
} = require('../services/availabilityValidation.service');
const Appointment = require('../models/appointment.model');

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Book an appointment with availability validation
 */
const bookAppointmentWithValidation = async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      specialty,
      appointmentDate,
      startTime,
      endTime,
      consultationFee,
      reason
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !specialty || !appointmentDate || !startTime || !endTime || consultationFee === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: patientId, doctorId, specialty, appointmentDate, startTime, endTime, consultationFee, reason'
      });
    }

    // Validate time format
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Time must be in HH:mm format'
      });
    }

    // Validate time logic
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    // Validate date
    const appointmentDateObj = new Date(appointmentDate);
    if (isNaN(appointmentDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date'
      });
    }

    // Check for existing appointment at same slot
    const existingAppointment = await Appointment.findOne({
      patientId: patientId.trim(),
      doctorId: doctorId.trim(),
      appointmentDate: appointmentDateObj,
      startTime: startTime.trim(),
      status: { $ne: 'CANCELLED' }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'You already have an appointment at this time'
      });
    }

    // Validate slot availability with doctor-service
    try {
      await validateAppointmentSlotAvailability(doctorId.trim(), appointmentDateObj, startTime.trim(), endTime.trim());
    } catch (error) {
      if (error instanceof AvailabilityValidationError) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }

    // Create appointment
    const appointment = await Appointment.create({
      patientId: patientId.trim(),
      doctorId: doctorId.trim(),
      specialty: specialty.trim(),
      appointmentDate: appointmentDateObj,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      consultationFee: parseFloat(consultationFee),
      reason: reason.trim(),
      status: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID'
    });

    // Mark slot as booked in doctor-service
    await markSlotAsBooked(doctorId.trim(), appointmentDateObj, startTime.trim());

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        consultationFee: appointment.consultationFee
      }
    });
  } catch (error) {
    console.error('Book appointment error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get patient's upcoming appointments
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    const { status, limit = 10, page = 1 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));

    const query = { patientId: patientId.trim() };
    if (status) {
      query.status = status.toUpperCase();
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .sort({ appointmentDate: -1, startTime: -1 })
        .skip(skip)
        .limit(Math.min(100, parseInt(limit)))
        .lean(),
      Appointment.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, parseInt(limit)),
        total,
        totalPages: Math.ceil(total / Math.min(100, parseInt(limit)))
      }
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};

/**
 * Reschedule an appointment
 */
const rescheduleAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { appointmentDate, startTime, endTime, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${appointment.status.toLowerCase()} appointment`
      });
    }

    // Validate new slot if provided
    if (appointmentDate && startTime && endTime) {
      if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'Time must be in HH:mm format'
        });
      }

      if (endTime <= startTime) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      const newDate = new Date(appointmentDate);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date'
        });
      }

      // Validate availability
      try {
        await validateAppointmentSlotAvailability(
          appointment.doctorId,
          newDate,
          startTime.trim(),
          endTime.trim()
        );
      } catch (error) {
        if (error instanceof AvailabilityValidationError) {
          return res.status(409).json({
            success: false,
            message: error.message
          });
        }
        throw error;
      }

      // Release old slot
      await releaseBookedSlot(
        appointment.doctorId,
        appointment.appointmentDate,
        appointment.startTime
      );

      // Update appointment
      appointment.appointmentDate = newDate;
      appointment.startTime = startTime.trim();
      appointment.endTime = endTime.trim();

      // Mark new slot as booked
      await markSlotAsBooked(appointment.doctorId, newDate, startTime.trim());
    }

    if (reason) {
      appointment.reason = reason.trim();
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime
      }
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment'
    });
  }
};

/**
 * Cancel an appointment
 */
const cancelAppointmentSafe = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }

    // Release slot in doctor-service
    await releaseBookedSlot(
      appointment.doctorId,
      appointment.appointmentDate,
      appointment.startTime
    );

    appointment.status = 'CANCELLED';
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointmentId: appointment._id,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
};

module.exports = {
  bookAppointmentWithValidation,
  getPatientAppointments,
  rescheduleAppointment,
  cancelAppointmentSafe,
  ValidationError,
  NotFoundError
};
