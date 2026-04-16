const express = require('express');
const {
  notifyEmail,
  notifySms,
  notifyEvent
} = require('../controllers/notification.controller');

const router = express.Router();

router.post('/email', notifyEmail);
router.post('/sms', notifySms);
router.post('/event', notifyEvent);

module.exports = router;
