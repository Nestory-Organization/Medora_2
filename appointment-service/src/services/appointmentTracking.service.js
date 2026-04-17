const mongoose = require('mongoose');
const env = require('../config/env');
const Appointment = require('../models/appointment.model');

// Fetch doctor details from doctor-service
const fetchDoctorDetails = async (doctorId) => {
  try {
    if (!doctorId) {
      return null;
    }

    const baseUrl = env.doctorServiceUrl?.replace(/\/+$/, '') || 'http://doctor-service:4003';
    const url = `${baseUrl}/doctor/public-profile/${String(doctorId).trim()}`;
    
    console.log(`[fetchDoctorDetails] Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    console.log(`[fetchDoctorDetails] Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`[fetchDoctorDetails] Response data:`, data);
      
      if (data.success && data.data) {
        // Extract the name from the response
        if (data.data.name) {
          console.log(`[fetchDoctorDetails] Found name: ${data.data.name}`);
          return data.data.name;
        }
        if (data.data.firstName && data.data.lastName) {
          const fullName = `Dr. ${data.data.firstName} ${data.data.lastName}`;
          console.log(`[fetchDoctorDetails] Constructed name: ${fullName}`);
          return fullName;
        }
      }
    } else {
      const errorText = await response.text();
      console.warn(`[fetchDoctorDetails] API error: ${response.status} - ${errorText}`);
    }
    
    return null;
  } catch (error) {
    console.error(`[fetchDoctorDetails] Error fetching doctor ${doctorId}:`, error.message);
    return null;
  }
};

const mapAppointmentDetails = (appointment) => ({
  _id: appointment._id,
  appointmentId: appointment._id,
  patientId: appointment.patientId,
  doctorId: appointment.doctorId,
  doctorName: appointment.doctorName,
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

  // Fetch doctor details for each appointment
  const enrichedAppointments = await Promise.all(
    appointments.map(async (apt) => {
      const doctorName = await fetchDoctorDetails(apt.doctorId);
      return {
        ...apt,
        doctorName: doctorName || `Doctor ${apt.doctorId.substring(0, 8)}`
      };
    })
  );

  return enrichedAppointments.map(mapAppointmentDetails);
};

const getAppointmentStatus = async (appointmentId) => {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    return null;
  }

  const appointment = await Appointment.findById(appointmentId).lean();

  if (!appointment) {
    return null;
  }

  // Fetch and enrich with doctor name
  const doctorName = await fetchDoctorDetails(appointment.doctorId);

  return mapAppointmentDetails({
    ...appointment,
    doctorName: doctorName || `Doctor ${appointment.doctorId.substring(0, 8)}`
  });
};

const getDoctorAppointments = async (doctorId) => {
  const normalizedDoctorId = doctorId.toString().trim();

  const appointments = await Appointment.find({
    doctorId: normalizedDoctorId
  })
    .sort({
      appointmentDate: 1,
      startTime: 1,
      createdAt: -1
    })
    .lean();

  console.log(`[AppointmentTrackingService] Found ${appointments.length} appointments for doctor ${doctorId}`);

  // Return appointments with patient data already stored in the appointment record
  return appointments.map(apt => ({
    _id: apt._id,
    appointmentId: apt._id,
    patientId: apt.patientId,
    patientName: apt.patientName || 'Patient',
    patientEmail: apt.patientEmail || null,
    patientPhone: apt.patientPhone || null,
    doctorId: apt.doctorId,
    specialty: apt.specialty,
    appointmentDate: apt.appointmentDate,
    startTime: apt.startTime,
    endTime: apt.endTime,
    status: apt.status,
    paymentStatus: apt.paymentStatus,
    consultationFee: apt.consultationFee,
    reason: apt.reason,
    createdAt: apt.createdAt,
    updatedAt: apt.updatedAt
  }));
};

module.exports = {
  getMyAppointments,
  getAppointmentStatus,
  getDoctorAppointments,
  fetchDoctorDetails
};
