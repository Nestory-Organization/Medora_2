const express = require('express');
const {
  createSession
} = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Root POST endpoint for payment creation (matches client request) - requires auth
router.post('/', authenticate, createSession);
router.post('/create-session', authenticate, createSession);

module.exports = router;
