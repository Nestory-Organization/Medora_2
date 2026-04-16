/**
 * Request Validation Middleware for Appointments
 */

const validateAppointmentBooking = (req, res, next) => {
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

  const errors = [];

  if (!patientId || typeof patientId !== 'string' || !patientId.trim()) {
    errors.push('patientId is required and must be a non-empty string');
  }

  if (!doctorId || typeof doctorId !== 'string' || !doctorId.trim()) {
    errors.push('doctorId is required and must be a non-empty string');
  }

  if (!specialty || typeof specialty !== 'string' || !specialty.trim()) {
    errors.push('specialty is required and must be a non-empty string');
  }

  if (!appointmentDate || typeof appointmentDate !== 'string') {
    errors.push('appointmentDate is required and must be a valid date string');
  } else {
    const date = new Date(appointmentDate);
    if (isNaN(date.getTime())) {
      errors.push('appointmentDate must be a valid ISO date string');
    }
  }

  if (!startTime || typeof startTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
    errors.push('startTime is required and must be in HH:mm format');
  }

  if (!endTime || typeof endTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
    errors.push('endTime is required and must be in HH:mm format');
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push('endTime must be after startTime');
  }

  if (consultationFee === undefined || typeof consultationFee !== 'number' || consultationFee < 0) {
    errors.push('consultationFee is required and must be a non-negative number');
  }

  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('reason is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

const validateRescheduleRequest = (req, res, next) => {
  const { appointmentDate, startTime, endTime, reason } = req.body;
  const errors = [];

  if (!appointmentDate && !startTime && !endTime && !reason) {
    errors.push('At least one field must be provided: appointmentDate, startTime, endTime, or reason');
  }

  if (appointmentDate) {
    if (typeof appointmentDate !== 'string') {
      errors.push('appointmentDate must be a valid date string');
    } else {
      const date = new Date(appointmentDate);
      if (isNaN(date.getTime())) {
        errors.push('appointmentDate must be a valid ISO date string');
      }
    }
  }

  if (startTime) {
    if (typeof startTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(startTime)) {
      errors.push('startTime must be in HH:mm format');
    }
  }

  if (endTime) {
    if (typeof endTime !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(endTime)) {
      errors.push('endTime must be in HH:mm format');
    }
  }

  if (startTime && endTime && startTime >= endTime) {
    errors.push('endTime must be after startTime');
  }

  if (reason && (typeof reason !== 'string' || !reason.trim())) {
    errors.push('reason must be a non-empty string');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateAppointmentBooking,
  validateRescheduleRequest
};
