const Appointment = require('../models/appointment.model');

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

class AppointmentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppointmentValidationError';
    this.statusCode = 400;
  }
}

class AppointmentConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppointmentConflictError';
    this.statusCode = 409;
  }
}

const requiredFields = [
  'patientId',
  'doctorId',
  'specialty',
  'appointmentDate',
  'startTime',
  'endTime',
  'consultationFee',
  'reason'
];

const normalizeDateToDay = (value) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppointmentValidationError('appointmentDate must be a valid date');
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const mapAppointment = (appointment) => ({
  appointmentId: appointment._id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  specialty: appointment.specialty,
  appointmentDate: appointment.appointmentDate,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  consultationFee: appointment.consultationFee,
  reason: appointment.reason,
  status: appointment.status,
  paymentStatus: appointment.paymentStatus,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt
});

const validatePayload = (payload) => {
  const missingFields = requiredFields.filter((field) => {
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
    throw new AppointmentValidationError(
      'Missing required fields: ' + missingFields.join(', ')
    );
  }

  if (!TIME_PATTERN.test(payload.startTime) || !TIME_PATTERN.test(payload.endTime)) {
    throw new AppointmentValidationError(
      'startTime and endTime must be in HH:mm format'
    );
  }

  if (payload.endTime <= payload.startTime) {
    throw new AppointmentValidationError('endTime must be later than startTime');
  }

  if (typeof payload.consultationFee !== 'number' || payload.consultationFee < 0) {
    throw new AppointmentValidationError(
      'consultationFee must be a non-negative number'
    );
  }
};

const createAppointment = async (payload) => {
  validatePayload(payload);

  const normalizedAppointmentDate = normalizeDateToDay(payload.appointmentDate);

  const existingAppointment = await Appointment.findOne({
    doctorId: payload.doctorId.trim(),
    appointmentDate: normalizedAppointmentDate,
    startTime: payload.startTime.trim()
  }).lean();

  if (existingAppointment) {
    throw new AppointmentConflictError('Appointment slot is already booked');
  }

  let created;

  try {
    created = await Appointment.create({
      patientId: payload.patientId.trim(),
      doctorId: payload.doctorId.trim(),
      specialty: payload.specialty.trim(),
      appointmentDate: normalizedAppointmentDate,
      startTime: payload.startTime.trim(),
      endTime: payload.endTime.trim(),
      consultationFee: payload.consultationFee,
      reason: payload.reason.trim()
    });
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppointmentConflictError('Appointment slot is already booked');
    }

    throw error;
  }

  // Future inter-service communication: create payment intent with payment-service.
  // Future inter-service communication: publish appointment-created event to notification-service.
  return mapAppointment(created);
};

module.exports = {
  createAppointment,
  AppointmentValidationError,
  AppointmentConflictError
};