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
	getAppointmentStatusById
} = require('../controllers/appointmentTracking.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Appointment booking with availability validation
router.post('/', bookAppointmentWithValidation);
router.put('/:id', modifyAppointment);
router.delete('/:id', cancelAppointmentById);
router.patch('/:id/payment-status', updateAppointmentPaymentStatusById);
router.get('/my-appointments', authenticate, getPatientAppointments);
router.get('/:id/status', authenticate, getAppointmentStatusById);

module.exports = router;