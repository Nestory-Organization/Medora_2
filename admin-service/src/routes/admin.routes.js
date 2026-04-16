const express = require('express');
const { 
  getAllDoctorsProfiles, 
  verifyDoctorProfile,
  getAllUsers,
  setUserActiveState,
  getTransactions,
  getDashboardStats,
  getReports
} = require('../controllers/admin.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// All admin routes require authentication and authorization
router.use(authenticate, authorizeAdmin);

router.get('/doctors', getAllDoctorsProfiles);
router.patch('/doctor/:doctorId/verify', verifyDoctorProfile);
router.get('/users', getAllUsers);
router.patch('/users/:userId/active', setUserActiveState);
router.get('/transactions', getTransactions);
router.get('/stats', getDashboardStats);
router.get('/reports', getReports);

module.exports = router;
