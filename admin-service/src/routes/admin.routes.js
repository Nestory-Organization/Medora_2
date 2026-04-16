const express = require('express');
const { 
  getAllDoctorsProfiles, 
  verifyDoctorProfile,
  getAllUsers
} = require('../controllers/admin.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication and authorization
router.use(authenticate, authorizeAdmin);

router.get('/doctors', getAllDoctorsProfiles);
router.patch('/doctor/:doctorId/verify', verifyDoctorProfile);
router.get('/users', getAllUsers);

module.exports = router;
