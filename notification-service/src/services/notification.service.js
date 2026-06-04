const nodemailer = require('nodemailer');
const Notification = require('../models/notification.model');
const env = require('../config/env');

const buildTransporter = () => {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });
};

const transporter = buildTransporter();

class NotificationValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotificationValidationError';
  }
}

const normalizeRecipientList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeEmailRecipients = (payload) => {
  return normalizeRecipientList(
    payload.emails ||
      payload.email ||
      payload.patientEmail ||
      payload.doctorEmail ||
      payload.recipients?.emails
  );
};

const normalizePhoneRecipients = (payload) => {
  return normalizeRecipientList(
    payload.phones ||
      payload.phone ||
      payload.patientPhone ||
      payload.doctorPhone ||
      payload.recipients?.phones
  );
};

const validateEmailPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new NotificationValidationError('Payload is required');
  }

  if (!payload.to || (typeof payload.to !== 'string' && !Array.isArray(payload.to))) {
    throw new NotificationValidationError('"to" email is required');
  }

  if (!payload.subject || typeof payload.subject !== 'string') {
    throw new NotificationValidationError('"subject" is required');
  }

  if (!payload.text && !payload.html) {
    throw new NotificationValidationError('Either "text" or "html" content is required');
  }
};

const validateSmsPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    throw new NotificationValidationError('Payload is required');
  }

  if (!payload.to || typeof payload.to !== 'string') {
    throw new NotificationValidationError('"to" phone number is required');
  }

  if (!payload.message || typeof payload.message !== 'string') {
    throw new NotificationValidationError('"message" is required');
  }
};

const normalizeEmailMode = () => String(env.emailMode || 'auto').toLowerCase();
const normalizeSmsMode = () => String(env.smsMode || 'mock').toLowerCase();

const sendEmail = async (payload) => {
  validateEmailPayload(payload);

  const mode = normalizeEmailMode();
  const useMock = mode === 'mock' || !transporter;

  let status = 'SENT';
  let provider = useMock ? 'mock-email' : 'smtp';
  let providerMessageId = null;
  let error = null;

  if (useMock) {
    providerMessageId = `mock-email-${Date.now()}`;
  } else {
    try {
      const result = await transporter.sendMail({
        from: payload.from || env.emailFrom,
        to: payload.to,
        subject: payload.subject,
        text: payload.text || undefined,
        html: payload.html || undefined
      });
      providerMessageId = result.messageId || null;
    } catch (sendError) {
      status = 'FAILED';
      error = sendError.message;
    }
  }

  const saved = await Notification.create({
    channel: 'EMAIL',
    eventType: payload.eventType || 'MANUAL',
    recipient: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
    subject: payload.subject,
    message: payload.text || payload.html,
    status,
    provider,
    providerMessageId,
    metadata: payload.metadata || null,
    error
  });

  return {
    notificationId: saved._id,
    channel: saved.channel,
    eventType: saved.eventType,
    recipient: saved.recipient,
    status: saved.status,
    provider: saved.provider,
    providerMessageId: saved.providerMessageId,
    error
  };
};

const sendSms = async (payload) => {
  validateSmsPayload(payload);

  const mode = normalizeSmsMode();
  const provider = mode === 'mock' ? 'mock-sms' : 'sms-api';

  let status = 'SENT';
  let providerMessageId = `mock-sms-${Date.now()}`;
  let error = null;

  if (mode !== 'mock') {
    status = 'SKIPPED';
    providerMessageId = null;
    error = 'SMS provider integration is not configured. Running in skip mode.';
  }

  const saved = await Notification.create({
    channel: 'SMS',
    eventType: payload.eventType || 'MANUAL',
    recipient: payload.to,
    message: payload.message,
    status,
    provider,
    providerMessageId,
    metadata: payload.metadata || null,
    error
  });

  return {
    notificationId: saved._id,
    channel: saved.channel,
    eventType: saved.eventType,
    recipient: saved.recipient,
    status: saved.status,
    provider: saved.provider,
    providerMessageId: saved.providerMessageId,
    warning: error
  };
};

const buildEventMessage = (eventType, payload) => {
  const type = String(eventType || '').toUpperCase();

  if (type === 'APPOINTMENT_BOOKED') {
    return {
      subject: 'Appointment booked successfully',
      emailText:
        `Your appointment has been booked for ${payload.appointmentDate || 'the selected date'} ` +
        `at ${payload.startTime || 'the selected time'}.` +
        `${payload.doctorName ? `\nDoctor: ${payload.doctorName}` : ''}` +
        `${payload.specialty ? `\nSpecialty: ${payload.specialty}` : ''}` +
        `\n\nPlease wait for the doctor to accept your appointment.`,
      smsText:
        `Medora: Appointment booked for ${payload.appointmentDate || 'selected date'} ${payload.startTime || ''}. Awaiting doctor approval.`.trim()
    };
  }

  if (type === 'APPOINTMENT_ACCEPTED') {
    return {
      subject: 'Appointment Accepted - Please Proceed with Payment',
      emailText:
        `Great news! Your appointment has been accepted.\n\n` +
        `Date: ${payload.appointmentDate || 'the scheduled date'}\n` +
        `Time: ${payload.startTime || ''}\n` +
        `${payload.specialty ? `Specialty: ${payload.specialty}\n` : ''}` +
        `${payload.doctorNote ? `\nNote from doctor: ${payload.doctorNote}\n` : ''}` +
        `\nPlease proceed with payment to confirm your appointment.`,
      smsText:
        `Medora: Your appointment on ${payload.appointmentDate || 'scheduled date'} was accepted. Please pay to confirm.`.trim()
    };
  }

  if (type === 'APPOINTMENT_REJECTED') {
    return {
      subject: 'Appointment Declined',
      emailText:
        `Unfortunately, your appointment request has been declined.\n\n` +
        `Date: ${payload.appointmentDate || 'the scheduled date'}\n` +
        `Time: ${payload.startTime || ''}\n` +
        `${payload.specialty ? `Specialty: ${payload.specialty}\n` : ''}` +
        `${payload.declineReason ? `\nReason: ${payload.declineReason}\n` : ''}` +
        `\nYou may book a new appointment at a different time.`,
      smsText:
        `Medora: Your appointment on ${payload.appointmentDate || 'scheduled date'} was declined. Please try another time.`.trim()
    };
  }

  if (type === 'APPOINTMENT_RESCHEDULED') {
    return {
      subject: 'Appointment rescheduled',
      emailText:
        `Your appointment has been rescheduled to ${payload.appointmentDate || 'the new date'} ` +
        `at ${payload.startTime || 'the new time'}.` +
        `${payload.reason ? `\nReason: ${payload.reason}` : ''}`,
      smsText:
        `Medora: Your appointment was rescheduled to ${payload.appointmentDate || 'new date'} ${payload.startTime || ''}`.trim()
    };
  }

  if (type === 'APPOINTMENT_CANCELLED') {
    return {
      subject: 'Appointment cancelled',
      emailText:
        `Your appointment for ${payload.appointmentDate || 'the scheduled date'} ` +
        `at ${payload.startTime || 'the scheduled time'} has been cancelled.` +
        `${payload.reason ? `\nReason: ${payload.reason}` : ''}`,
      smsText:
        `Medora: Your appointment on ${payload.appointmentDate || 'scheduled date'} has been cancelled.`
    };
  }

  if (type === 'PAYMENT_SUCCESS') {
    return {
      subject: 'Payment completed successfully',
      emailText:
        `We received your payment of ${payload.currency || 'LKR'} ${payload.amount || ''}. ` +
        `Appointment ${payload.appointmentId || ''} is confirmed.`,
      smsText:
        `Medora: Payment successful for appointment ${payload.appointmentId || ''}.`
    };
  }

  if (type === 'APPOINTMENT_COMPLETED') {
    return {
      subject: 'Appointment completed',
      emailText:
        `Your appointment ${payload.appointmentId || ''} has been marked as completed. ` +
        'Thank you for using Medora.',
      smsText: `Medora: Appointment ${payload.appointmentId || ''} completed.`
    };
  }

  return {
    subject: payload.subject || 'Medora notification',
    emailText: payload.message || 'You have a new notification from Medora.',
    smsText: payload.message || 'You have a new notification from Medora.'
  };
};

const notifyByEvent = async (payload) => {
  const eventType = String(payload.eventType || '').toUpperCase();

  if (!eventType) {
    throw new NotificationValidationError('eventType is required');
  }

  const channels = Array.isArray(payload.channels) && payload.channels.length > 0
    ? payload.channels.map((item) => String(item).toUpperCase())
    : ['EMAIL', 'SMS'];

  const templates = buildEventMessage(eventType, payload);
  const results = [];

  const emailRecipients = normalizeEmailRecipients(payload);
  const phoneRecipients = normalizePhoneRecipients(payload);

  if (channels.includes('EMAIL')) {
    if (emailRecipients.length) {
      for (const recipient of emailRecipients) {
        const emailResult = await sendEmail({
          to: recipient,
          subject: templates.subject,
          text: templates.emailText,
          eventType,
          metadata: payload.metadata || payload
        });
        results.push(emailResult);
      }
    } else {
      results.push({
        channel: 'EMAIL',
        status: 'SKIPPED',
        warning: 'No email recipient provided'
      });
    }
  }

  if (channels.includes('SMS')) {
    if (phoneRecipients.length) {
      for (const recipient of phoneRecipients) {
        const smsResult = await sendSms({
          to: recipient,
          message: templates.smsText,
          eventType,
          metadata: payload.metadata || payload
        });
        results.push(smsResult);
      }
    } else {
      results.push({
        channel: 'SMS',
        status: 'SKIPPED',
        warning: 'No phone recipient provided'
      });
    }
  }

  return {
    eventType,
    notifications: results
  };
};

module.exports = {
  sendEmail,
  sendSms,
  notifyByEvent,
  NotificationValidationError
};
