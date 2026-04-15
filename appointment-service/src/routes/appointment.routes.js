const express = require('express');
const { bookAppointment } = require('../controllers/appointment.controller');

const router = express.Router();

router.post('/', bookAppointment);

module.exports = router;