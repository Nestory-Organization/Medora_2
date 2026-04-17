const mongoose = require('mongoose');
const Appointment = require('../models/appointment.model');
const env = require('../config/env');
const { fetchDoctorById } = require('./doctorSearch.service');

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

class AppointmentNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppointmentNotFoundError';
    this.statusCode = 404;
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

const blockedUpdateStatuses = ['CANCELLED', 'COMPLETED'];
const APPOINTMENT_STATUSES = [
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED'
];
const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'];

const publishNotificationEvent = async (eventType, payload) => {
  const baseUrl = String(env.notificationServiceUrl || '').replace(/\/$/, '');

  if (!baseUrl) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, env.serviceRequestTimeoutMs);

  try {
    const response = await fetch(baseUrl + '/notify/event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventType,
        ...payload
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error('notification-service event publish failed:', {
        eventType,
        statusCode: response.status
      });
    }
  } catch (error) {
    console.error('notification-service event publish error:', {
      eventType,
      error: error.name === 'AbortError' ? 'Request timed out' : error.message
    });
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeDateToDay = (value) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppointmentValidationError('appointmentDate must be a valid date');
  }

  parsedDate.setUTCHours(0, 0, 0, 0);
  return parsedDate;
};

const mapAppointment = async (appointment) => {
  // Fetch doctor details to include doctor name
  let doctorName = 'Unknown Doctor';
  try {
    const doctorProfile = await fetchDoctorById(appointment.doctorId);
    if (doctorProfile && doctorProfile.name) {
      doctorName = doctorProfile.name;
    } else if (doctorProfile && doctorProfile.firstName && doctorProfile.lastName) {
      doctorName = `Dr. ${doctorProfile.firstName} ${doctorProfile.lastName}`;
    }
  } catch (error) {
    console.error('Error fetching doctor name:', error);
    // Continue without doctor name on error
  }

  return {
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    doctorName: doctorName,
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
  };
};

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

const validateUpdatePayload = (payload) => {
  const allowedFields = ['appointmentDate', 'startTime', 'endTime', 'reason'];
  const updateKeys = Object.keys(payload || {}).filter((key) =>
    allowedFields.includes(key)
  );

  if (updateKeys.length === 0) {
    throw new AppointmentValidationError(
      'At least one updatable field is required: appointmentDate, startTime, endTime, reason'
    );
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'reason') &&
    (typeof payload.reason !== 'string' || !payload.reason.trim())
  ) {
    throw new AppointmentValidationError('reason must be a non-empty string');
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'startTime') &&
    !TIME_PATTERN.test(payload.startTime)
  ) {
    throw new AppointmentValidationError('startTime must be in HH:mm format');
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, 'endTime') &&
    !TIME_PATTERN.test(payload.endTime)
  ) {
    throw new AppointmentValidationError('endTime must be in HH:mm format');
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
      patientName: payload.patientName ? payload.patientName.trim() : 'Patient',
      patientPhone: payload.patientPhone ? payload.patientPhone.trim() : null,
      patientEmail: payload.patientEmail ? payload.patientEmail.trim() : null,
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

  publishNotificationEvent('APPOINTMENT_BOOKED', {
    appointmentId: String(created._id),
    patientId: created.patientId,
    doctorId: created.doctorId,
    appointmentDate: created.appointmentDate,
    startTime: created.startTime,
    metadata: {
      specialty: created.specialty,
      consultationFee: created.consultationFee
    },
    email: payload.patientEmail || null,
    phone: payload.patientPhone || null
  });

  return await mapAppointment(created);
};

const updateAppointment = async (appointmentId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppointmentValidationError('Invalid appointment id');
  }

  validateUpdatePayload(payload);

  const existingAppointment = await Appointment.findById(appointmentId);

  if (!existingAppointment) {
    throw new AppointmentNotFoundError('Appointment not found');
  }

  if (blockedUpdateStatuses.includes(existingAppointment.status)) {
    throw new AppointmentValidationError(
      'Cannot modify appointment when status is ' + existingAppointment.status
    );
  }

  const nextAppointmentDate = Object.prototype.hasOwnProperty.call(
    payload,
    'appointmentDate'
  )
    ? normalizeDateToDay(payload.appointmentDate)
    : existingAppointment.appointmentDate;

  const nextStartTime = Object.prototype.hasOwnProperty.call(payload, 'startTime')
    ? payload.startTime.trim()
    : existingAppointment.startTime;

  const nextEndTime = Object.prototype.hasOwnProperty.call(payload, 'endTime')
    ? payload.endTime.trim()
    : existingAppointment.endTime;

  if (nextEndTime <= nextStartTime) {
    throw new AppointmentValidationError('endTime must be later than startTime');
  }

  const hasSlotChanged =
    nextStartTime !== existingAppointment.startTime ||
    nextAppointmentDate.getTime() !== existingAppointment.appointmentDate.getTime();

  if (hasSlotChanged) {
    const conflictingAppointment = await Appointment.findOne({
      _id: { $ne: existingAppointment._id },
      doctorId: existingAppointment.doctorId,
      appointmentDate: nextAppointmentDate,
      startTime: nextStartTime
    }).lean();

    if (conflictingAppointment) {
      throw new AppointmentConflictError('Appointment slot is already booked');
    }
  }

  existingAppointment.appointmentDate = nextAppointmentDate;
  existingAppointment.startTime = nextStartTime;
  existingAppointment.endTime = nextEndTime;

  if (Object.prototype.hasOwnProperty.call(payload, 'reason')) {
    existingAppointment.reason = payload.reason.trim();
  }

  let updated;
  try {
    updated = await existingAppointment.save();
  } catch (error) {
    if (error?.code === 11000) {
      throw new AppointmentConflictError('Appointment slot is already booked');
    }

    throw error;
  }

  publishNotificationEvent('APPOINTMENT_RESCHEDULED', {
    appointmentId: String(updated._id),
    patientId: updated.patientId,
    doctorId: updated.doctorId,
    appointmentDate: updated.appointmentDate,
    startTime: updated.startTime,
    metadata: {
      specialty: updated.specialty,
      reason: updated.reason
    }
  });

  return await mapAppointment(updated);
};

const cancelAppointment = async (appointmentId) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppointmentValidationError('Invalid appointment id');
  }

  const existingAppointment = await Appointment.findById(appointmentId);

  if (!existingAppointment) {
    throw new AppointmentNotFoundError('Appointment not found');
  }

  if (existingAppointment.status === 'CANCELLED') {
    throw new AppointmentValidationError('Appointment is already cancelled');
  }

  if (existingAppointment.status === 'COMPLETED') {
    throw new AppointmentValidationError(
      'Cannot cancel appointment when status is COMPLETED'
    );
  }

  existingAppointment.status = 'CANCELLED';

  const updated = await existingAppointment.save();

  // Future inter-service communication: trigger refund workflow with payment-service.
  publishNotificationEvent('APPOINTMENT_CANCELLED', {
    appointmentId: String(updated._id),
    patientId: updated.patientId,
    doctorId: updated.doctorId,
    appointmentDate: updated.appointmentDate,
    startTime: updated.startTime,
    metadata: {
      specialty: updated.specialty
    }
  });

  return await mapAppointment(updated);
};

const updateAppointmentPaymentState = async (appointmentId, payload) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw new AppointmentValidationError('Invalid appointment id');
  }

  if (!payload || typeof payload !== 'object') {
    throw new AppointmentValidationError('Request payload is required');
  }

  const hasPaymentStatus = Object.prototype.hasOwnProperty.call(
    payload,
    'paymentStatus'
  );

  if (!hasPaymentStatus) {
    throw new AppointmentValidationError('paymentStatus is required');
  }

  const paymentStatus = String(payload.paymentStatus).trim().toUpperCase();

  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw new AppointmentValidationError(
      'paymentStatus must be one of: ' + PAYMENT_STATUSES.join(', ')
    );
  }

  const nextStatus = Object.prototype.hasOwnProperty.call(payload, 'status')
    ? String(payload.status).trim().toUpperCase()
    : null;

  if (nextStatus && !APPOINTMENT_STATUSES.includes(nextStatus)) {
    throw new AppointmentValidationError(
      'status must be one of: ' + APPOINTMENT_STATUSES.join(', ')
    );
  }

  const existingAppointment = await Appointment.findById(appointmentId);

  if (!existingAppointment) {
    throw new AppointmentNotFoundError('Appointment not found');
  }

  if (
    nextStatus === 'CONFIRMED' &&
    ['CANCELLED', 'COMPLETED'].includes(existingAppointment.status)
  ) {
    throw new AppointmentValidationError(
      'Cannot confirm appointment when status is ' + existingAppointment.status
    );
  }

  existingAppointment.paymentStatus = paymentStatus;

  if (nextStatus) {
    existingAppointment.status = nextStatus;
  }

  const updated = await existingAppointment.save();

  if (nextStatus === 'COMPLETED') {
    publishNotificationEvent('APPOINTMENT_COMPLETED', {
      appointmentId: String(updated._id),
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      appointmentDate: updated.appointmentDate,
      startTime: updated.startTime,
      metadata: {
        paymentStatus: updated.paymentStatus
      }
    });
  }

  return await mapAppointment(updated);
};

module.exports = {
  createAppointment,
  updateAppointment,
  cancelAppointment,
  updateAppointmentPaymentState,
  AppointmentValidationError,
  AppointmentConflictError,
  AppointmentNotFoundError
};