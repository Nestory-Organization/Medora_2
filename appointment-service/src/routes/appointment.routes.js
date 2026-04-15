const express = require('express');
const {
  bookAppointment,
  modifyAppointment
} = require('../controllers/appointment.controller');
const {
	getPatientAppointments,
	getAppointmentStatusById
} = require('../controllers/appointmentTracking.controller');

const router = express.Router();

// Future auth integration: attach authentication middleware and derive patientId from token claims.
router.post('/', bookAppointment);
router.put('/:id', modifyAppointment);
router.get('/my-appointments', getPatientAppointments);
router.get('/:id/status', getAppointmentStatusById);

module.exports = router;