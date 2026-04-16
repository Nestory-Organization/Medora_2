const express = require('express');
const {
  createSession,
  handleWebhook
} = require('../controllers/payment.controller');

const router = express.Router();

router.post('/create-session', createSession);
router.post('/webhook', handleWebhook);

module.exports = router;
