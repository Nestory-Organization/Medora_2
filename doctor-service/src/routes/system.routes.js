const express = require('express');
const { getHealth, getStatus, getAllDoctors, verifyDoctor } = require('../controllers/system.controller');

const router = express.Router();

router.get('/health', getHealth);
router.get('/status', getStatus);

// Internal routes for administration (No auth required - internal use only)
router.get('/doctors', getAllDoctors);
router.patch('/doctors/:doctorId/verify', verifyDoctor);

module.exports = router;

