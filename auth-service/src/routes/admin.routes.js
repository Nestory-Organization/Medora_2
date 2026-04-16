const express = require('express');
const {
  listUsers,
  verifyDoctor,
  listTransactions,
  getStats,
  listActivity,
  setUserActive
} = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/users', listUsers);
router.put('/verify-doctor', verifyDoctor);
router.get('/transactions', listTransactions);
router.get('/stats', getStats);
router.get('/activity', listActivity);
router.patch('/users/:userId/active', setUserActive);

module.exports = router;
