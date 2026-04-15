const mongoose = require('mongoose');
const Appointment = require('../models/appointment.model');

const mapAppointmentDetails = (appointment) => ({
  appointmentId: appointment._id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  specialty: appointment.specialty,
  appointmentDate: appointment.appointmentDate,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  status: appointment.status,
  paymentStatus: appointment.paymentStatus,
  consultationFee: appointment.consultationFee,
  reason: appointment.reason
});

const getMyAppointments = async (patientId) => {
  const normalizedPatientId = patientId.trim();

  const appointments = await Appointment.find({
    patientId: normalizedPatientId
  })
    .sort({
      appointmentDate: -1,
      startTime: -1,
      createdAt: -1
    })
    .lean();

  return appointments.map(mapAppointmentDetails);
};

const getAppointmentStatus = async (appointmentId) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return null;
  }

  const appointment = await Appointment.findById(appointmentId).lean();

  if (!appointment) {
    return null;
  }

  return mapAppointmentDetails(appointment);
};

module.exports = {
  getMyAppointments,
  getAppointmentStatus
};
