const express = require('express');
const { register, login, profile, getAllUsers } = require('../controllers/auth.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, profile);
router.get('/users', authenticate, authorize('admin'), getAllUsers);

module.exports = router;
