const express = require('express');
const {
  searchDoctorsBySpecialty,
  getDoctorProfile,
  getVerifiedDoctors
} = require('../controllers/doctorSearch.controller');

const router = express.Router();

// Public endpoints - no auth required
router.get('/search', searchDoctorsBySpecialty);
router.get('/verified', getVerifiedDoctors);
router.get('/:doctorId', getDoctorProfile);

module.exports = router;
