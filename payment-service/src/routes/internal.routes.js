const express = require('express');
const { requireInternalKey } = require('../middleware/internalAuth.middleware');
const { listTransactions } = require('../controllers/internal.controller');

const router = express.Router();

router.get('/transactions', requireInternalKey, listTransactions);

module.exports = router;
