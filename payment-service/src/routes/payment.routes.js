const express = require('express');
const {
  createSession,
  confirmSessionPayment,
  reconcileAppointmentPayment,
  getDoctorEarningsHandler,
  getAllDoctorEarningsHandler
} = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Root POST endpoint for payment creation (matches client request) - requires auth
router.post('/', authenticate, createSession);
router.post('/create-session', authenticate, createSession);
router.post('/confirm-session', authenticate, confirmSessionPayment);
router.post('/reconcile/:appointmentId', authenticate, reconcileAppointmentPayment);

// Doctor earnings routes
router.get('/doctor/:doctorId/earnings', authenticate, getDoctorEarningsHandler);
router.get('/earnings/all-doctors', authenticate, getAllDoctorEarningsHandler);

module.exports = router;
