const express = require('express');
const {
  createDoctorProfile,
  updateDoctorProfile,
  setAvailability,
  getAssignedAppointments,
  updateAppointmentStatus,
  addPrescription
} = require('../controllers/doctor.controller');
const { authenticate, authorizeDoctor } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorizeDoctor);

router.post('/doctor/profile', createDoctorProfile);
router.put('/doctor/profile', updateDoctorProfile);
router.post('/doctor/availability', setAvailability);
router.get('/doctor/appointments', getAssignedAppointments);
router.put('/doctor/appointment/:id/status', updateAppointmentStatus);
router.post('/doctor/prescription', addPrescription);

module.exports = router;
