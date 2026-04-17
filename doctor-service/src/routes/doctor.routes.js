const express = require('express');
const {
  createDoctorProfile,
  updateDoctorProfile,
  setAvailability,
  getDoctorAvailability,
  markSlotBooked,
  releaseSlot,
  getAssignedAppointments,
  updateAppointmentStatus,
  addPrescription,
  createTelemedicineSession
} = require('../controllers/doctor.controller');
const {
  addPrescriptionToAppointment,
  getPrescriptionDetails,
  initializeTelemedicineSession,
  getTelemedicineSession,
  completeAppointment,
  addPatientReport
} = require('../controllers/prescriptionAndSession.controller');
const {
  getAppointmentNotes,
  createAppointmentNotes,
  updateAppointmentNotes,
  deleteAppointmentNotes
} = require('../controllers/appointmentNotes.controller');
const { 
  authenticate, 
  authorizeDoctor, 
  checkDoctorVerified 
} = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorizeDoctor);

// Allow creating a profile even if not verified
router.post('/profile', createDoctorProfile);

// NOTE: /availability endpoints (GET, mark-booked, release-slot) are now PUBLIC
// They are mounted directly in app.js for inter-service communication
// Only keeping POST /availability for doctors to set their availability

// Allow posting availability without verification
router.post('/availability', setAvailability);

router.use(checkDoctorVerified);

router.put('/profile', updateDoctorProfile);
router.get('/appointments', getAssignedAppointments);
router.put('/appointment/:id/status', updateAppointmentStatus);

// Prescription endpoints
router.post('/appointment/:appointmentId/prescription', addPrescriptionToAppointment);
router.get('/appointment/:appointmentId/prescription', getPrescriptionDetails);

// Telemedicine session endpoints
router.post('/appointment/:appointmentId/session', initializeTelemedicineSession);
router.get('/appointment/:appointmentId/session', getTelemedicineSession);

// Appointment completion
router.patch('/appointment/:appointmentId/complete', completeAppointment);

// Patient report/documentation
router.post('/appointment/:appointmentId/report', addPatientReport);

// Appointment notes
router.get('/appointment/:appointmentId/notes', getAppointmentNotes);
router.post('/appointment/:appointmentId/notes', createAppointmentNotes);
router.put('/appointment/:appointmentId/notes', updateAppointmentNotes);
router.delete('/appointment/:appointmentId/notes', deleteAppointmentNotes);

module.exports = router;
