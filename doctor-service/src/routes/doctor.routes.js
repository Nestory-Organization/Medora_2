const express = require('express');
const {
  createDoctorProfile,
  getDoctorProfile,
  getDoctorProfileById,
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
  getPatientPrescriptions,
  initializeTelemedicineSession,
  getTelemedicineSession,
  completeAppointment,
  addPatientReport
} = require('../controllers/prescriptionAndSession.controller');
const {
  getPendingRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest
} = require('../controllers/rescheduleRequest.controller');
const { 
  authenticate, 
  authorizeDoctor, 
  checkDoctorVerified 
} = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorizeDoctor);

// Allow creating and getting profile even if not verified
router.post('/profile', createDoctorProfile);
router.get('/profile', getDoctorProfile);
router.get('/profile/:doctorId', getDoctorProfileById);

// NOTE: /availability endpoints (GET, mark-booked, release-slot) are now PUBLIC
// They are mounted directly in app.js for inter-service communication
// Only keeping POST /availability for doctors to set their availability

// Allow posting availability without verification
router.post('/availability', setAvailability);

// Allow fetching appointments without verification (doctors need to see new requests)
router.get('/appointments', getAssignedAppointments);
router.put('/appointment/:id/status', updateAppointmentStatus);

router.use(checkDoctorVerified);

router.put('/profile', updateDoctorProfile);

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

// Reschedule request endpoints
router.get('/reschedule-requests/:doctorId', getPendingRescheduleRequests);
router.put('/appointment/:appointmentId/reschedule-request/approve', approveRescheduleRequest);
router.put('/appointment/:appointmentId/reschedule-request/reject', rejectRescheduleRequest);

// --- PUBLIC ENDPOINTS (No middleware applied individually) ---
// These are currently under router.use(authenticate, ...)
// To make them truly public while keeping other routes protected, 
// they should be moved to app.js or bypass the middleware here.
// For now, moving prescriptions endpoint to app.js in my next step.

module.exports = router;
