const express = require('express');
const { 
  getAllDoctorsProfiles, 
  verifyDoctorProfile,
  getAllUsers,
  adminLogin
} = require('../controllers/admin.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public admin login
router.post('/login', adminLogin);

// Protected routes
router.use(authenticate, authorizeAdmin);

router.get('/doctors', getAllDoctorsProfiles);
router.patch('/doctor/:doctorId/verify', verifyDoctorProfile);
router.get('/users', getAllUsers);

module.exports = router;
