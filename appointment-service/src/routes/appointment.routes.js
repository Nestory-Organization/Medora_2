const express = require('express');
const {
  bookAppointment,
	modifyAppointment,
	cancelAppointmentById,
	updateAppointmentPaymentStatusById
} = require('../controllers/appointment.controller');
const { 
	bookAppointmentWithValidation,
} = require('../controllers/appointmentManagement.controller');
const {
	getPatientAppointments,
	getAppointmentStatusById,
	getAppointmentById,
	getDoctorAppointmentsById
} = require('../controllers/appointmentTracking.controller');
const {
	getOrCreateTelemedicineSession,
	initiateTelemedicineCall,
	endTelemedicineCall,
	updateSessionParticipant,
	getSessionDetails,
	addSessionNotes,
	getSessionByRoomId
} = require('../controllers/telemedicine.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Appointment booking with availability validation
router.post('/', bookAppointmentWithValidation);

// DEBUG: Verify auth token (private endpoint)
router.get('/verify-auth', authenticate, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authentication verified',
    user: req.user,
    patientId: req.user?.id
  });
});

// IMPORTANT: More specific routes MUST come before generic :id routes
// GET /my-appointments can work with query param patientId OR with JWT auth
router.get('/my-appointments', getPatientAppointments);

// GET /doctor/:doctorId - specific route for doctor's appointments
router.get('/doctor/:doctorId', getDoctorAppointmentsById);

// Telemedicine routes - must come before :id routes
// Public route for patient to access session by roomId
router.get('/telemedicine/room/:roomId', getSessionByRoomId);

router.get('/:appointmentId/telemedicine', authenticate, getOrCreateTelemedicineSession);
router.post('/:appointmentId/telemedicine', authenticate, initiateTelemedicineCall);
router.put('/:appointmentId/telemedicine', authenticate, endTelemedicineCall);
router.patch('/:appointmentId/telemedicine/participant', authenticate, updateSessionParticipant);
router.get('/:appointmentId/telemedicine/session', authenticate, getSessionDetails);
router.post('/:appointmentId/telemedicine/notes', authenticate, addSessionNotes);

router.get('/:id', authenticate, getAppointmentById);
router.get('/:id/status', authenticate, getAppointmentStatusById);

router.put('/:id', modifyAppointment);
router.delete('/:id', cancelAppointmentById);
router.patch('/:id/payment-status', updateAppointmentPaymentStatusById);

module.exports = router;