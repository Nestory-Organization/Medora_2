const Appointment = require('../models/appointment.model');
const env = require('../config/env');

const doctorServiceBaseUrl = (env.doctorServiceUrl || 'http://doctor-service:4003').replace(/\/+$/, '');

const normalizeDateForSlotApi = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

const isSlotAvailable = async (doctorId, requestedDate, requestedStartTime, requestedEndTime) => {
  const dateForApi = normalizeDateForSlotApi(requestedDate);
  if (!dateForApi) {
    return false;
  }

  const url = `${doctorServiceBaseUrl}/doctor/availability?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(dateForApi)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch doctor availability: ${response.status}`);
  }

  const payload = await response.json();
  const availabilities = Array.isArray(payload?.data) ? payload.data : [];

  const matchingSlot = availabilities
    .flatMap((item) => (Array.isArray(item?.slots) ? item.slots : []))
    .find(
      (slot) =>
        slot?.startTime === requestedStartTime &&
        slot?.endTime === requestedEndTime &&
        slot?.isBooked === false
    );

  return Boolean(matchingSlot);
};

const callDoctorSlotMutation = async (path, payload) => {
  const response = await fetch(`${doctorServiceBaseUrl}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Doctor slot mutation failed (${response.status}): ${body}`);
  }
};

// Patient requests to reschedule
const requestReschedule = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { requestedDate, requestedStartTime, requestedEndTime, reason } = req.body;

    if (!appointmentId || !requestedDate || !requestedStartTime || !requestedEndTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: appointmentId, requestedDate, requestedStartTime, requestedEndTime',
        data: null
      });
    }

    const requestedDateObj = new Date(requestedDate);
    if (Number.isNaN(requestedDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requestedDate',
        data: null
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        data: null
      });
    }

    if (['CANCELLED', 'COMPLETED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only active appointments can be rescheduled',
        data: null
      });
    }

    // Check if already has a pending reschedule request
    if (appointment.rescheduleRequest?.status === 'PENDING') {
      return res.status(409).json({
        success: false,
        message: 'Appointment already has a pending reschedule request',
        data: null
      });
    }

    const available = await isSlotAvailable(
      appointment.doctorId,
      requestedDateObj,
      requestedStartTime,
      requestedEndTime
    );

    if (!available) {
      return res.status(409).json({
        success: false,
        message: 'Selected slot is not currently available for this doctor',
        data: null
      });
    }

    // Update appointment with reschedule request
    appointment.rescheduleRequest = {
      status: 'PENDING',
      requestedDate: requestedDateObj,
      requestedStartTime,
      requestedEndTime,
      reason: reason || 'Patient requested to reschedule',
      createdAt: new Date(),
      approvedAt: null,
      rejectionReason: null
    };

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Reschedule request submitted successfully. Awaiting doctor approval.',
      data: appointment
    });
  } catch (error) {
    console.error('Request reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request reschedule',
      error: error.message,
      data: null
    });
  }
};

// Doctor approves reschedule request
const approveReschedule = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        data: null
      });
    }

    if (appointment.rescheduleRequest?.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending reschedule request for this appointment',
        data: null
      });
    }

    const requestedDate = appointment.rescheduleRequest.requestedDate;
    const requestedStartTime = appointment.rescheduleRequest.requestedStartTime;
    const requestedEndTime = appointment.rescheduleRequest.requestedEndTime;

    const slotStillAvailable = await isSlotAvailable(
      appointment.doctorId,
      requestedDate,
      requestedStartTime,
      requestedEndTime
    );

    if (!slotStillAvailable) {
      return res.status(409).json({
        success: false,
        message: 'Requested slot is no longer available. Please ask patient to submit another request.',
        data: null
      });
    }

    const oldDate = appointment.appointmentDate;
    const oldStartTime = appointment.startTime;

    await callDoctorSlotMutation('/doctor/availability/mark-booked', {
      doctorId: appointment.doctorId,
      date: requestedDate,
      startTime: requestedStartTime
    });

    const nextStatus = appointment.paymentStatus === 'PAID' ? 'CONFIRMED' : appointment.status;

    const newAppointmentPayload = {
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: appointment.patientEmail,
      doctorId: appointment.doctorId,
      specialty: appointment.specialty,
      appointmentDate: requestedDate,
      startTime: requestedStartTime,
      endTime: requestedEndTime,
      consultationFee: appointment.consultationFee,
      reason: appointment.reason,
      status: nextStatus,
      paymentStatus: appointment.paymentStatus
    };

    let newAppointment;
    try {
      newAppointment = await Appointment.create(newAppointmentPayload);
    } catch (error) {
      await callDoctorSlotMutation('/doctor/availability/release-slot', {
        doctorId: appointment.doctorId,
        date: requestedDate,
        startTime: requestedStartTime
      });
      throw error;
    }

    await callDoctorSlotMutation('/doctor/availability/release-slot', {
      doctorId: appointment.doctorId,
      date: oldDate,
      startTime: oldStartTime
    });

    await Appointment.findByIdAndDelete(appointment._id);

    return res.status(200).json({
      success: true,
      message: 'Reschedule request approved. New appointment created and old appointment removed.',
      data: {
        newAppointment,
        replacedAppointmentId: appointmentId
      }
    });
  } catch (error) {
    console.error('Approve reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve reschedule',
      error: error.message,
      data: null
    });
  }
};

// Doctor rejects reschedule request
const rejectReschedule = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rejectionReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        data: null
      });
    }

    if (appointment.rescheduleRequest?.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'No pending reschedule request for this appointment',
        data: null
      });
    }

    // Mark reschedule as rejected
    appointment.rescheduleRequest.status = 'REJECTED';
    appointment.rescheduleRequest.rejectionReason = rejectionReason || 'Doctor declined the reschedule request';

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Reschedule request rejected',
      data: appointment
    });
  } catch (error) {
    console.error('Reject reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject reschedule',
      error: error.message,
      data: null
    });
  }
};

// Get reschedule requests for a doctor
const getDoctorRescheduleRequests = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find({
      doctorId,
      'rescheduleRequest.status': 'PENDING'
    }).sort({ 'rescheduleRequest.createdAt': -1 });

    return res.status(200).json({
      success: true,
      message: 'Reschedule requests fetched successfully',
      data: appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Get doctor reschedule requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reschedule requests',
      error: error.message,
      data: null
    });
  }
};

module.exports = {
  requestReschedule,
  approveReschedule,
  rejectReschedule,
  getDoctorRescheduleRequests
};
