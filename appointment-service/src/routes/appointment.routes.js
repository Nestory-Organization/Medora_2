const express = require('express');
const {
  bookAppointment,
	modifyAppointment,
	cancelAppointmentById,
	updateAppointmentPaymentStatusById
} = require('../controllers/appointment.controller');
const { 
	bookAppointmentWithValidation,
	getPatientAppointments
} = require('../controllers/appointmentManagement.controller');
const {
	getAppointmentStatusById,
  getAppointmentPaymentEligibility,
	getAppointmentById,
  getDoctorAppointmentsById,
  updateDoctorAppointmentStatus
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
const {
	requestReschedule,
	approveReschedule,
	rejectReschedule,
	getDoctorRescheduleRequests
} = require('../controllers/rescheduleRequest.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

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

// PUT /:id/doctor-status - doctor accepts/declines appointment
router.put('/:id/doctor-status', authenticate, authorize('doctor'), updateDoctorAppointmentStatus);

// GET /:id/payment-eligibility - payment-service checks if patient can pay
router.get('/:id/payment-eligibility', getAppointmentPaymentEligibility);

// GET /patient/:patientId/prescriptions - get prescriptions from appointments for a patient
router.get('/patient/:patientId/prescriptions', async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient ID is required' });
    }
    const Appointment = require('../models/appointment.model');
    const appointmentsWithPrescriptions = await Appointment.find({
      patientId: patientId,
      'prescriptions.0': { $exists: true }
    }).lean();
    const prescriptions = [];
    for (const appointment of appointmentsWithPrescriptions) {
      if (appointment.prescriptions && Array.isArray(appointment.prescriptions)) {
        for (const prescription of appointment.prescriptions) {
          prescriptions.push({
            ...prescription,
            appointmentId: appointment._id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName,
            doctorSpecialty: appointment.specialty,
            medicines: prescription.medicines || [],
            prescriptionDate: prescription.createdAt || prescription.date,
          });
        }
      }
    }
    prescriptions.sort((a, b) => new Date(b.prescriptionDate) - new Date(a.prescriptionDate));
    return res.status(200).json({
      success: true,
      message: 'Patient prescriptions fetched successfully',
      data: prescriptions,
      count: prescriptions.length
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions',
      data: null,
      error: error.message
    });
  }
});

// Telemedicine routes - must come before :id routes
// Public route for patient to access session by roomId
router.get('/telemedicine/room/:roomId', getSessionByRoomId);

// Reschedule request routes - must come before :id routes
router.post('/:appointmentId/reschedule-request', requestReschedule);
router.put('/:appointmentId/reschedule-request/approve', approveReschedule);
router.put('/:appointmentId/reschedule-request/reject', rejectReschedule);
router.get('/doctor/:doctorId/reschedule-requests', getDoctorRescheduleRequests);

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