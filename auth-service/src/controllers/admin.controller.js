const User = require('../models/user.model');
const AdminAuditLog = require('../models/adminAuditLog.model');
const env = require('../config/env');

async function logAdminAction(adminId, action, targetUserId, metadata) {
  await AdminAuditLog.create({
    adminId,
    action,
    targetUserId: targetUserId || null,
    metadata: metadata || null
  });
}

async function fetchPaymentTransactions(query) {
  const base = (env.paymentServiceUrl || '').replace(/\/$/, '');
  if (!base || !env.internalApiKey) {
    return {
      ok: false,
      status: 503,
      body: {
        success: false,
        message: 'Payment aggregation is not configured',
        data: { items: [], pagination: { page: 1, limit: 20, total: 0 }, revenue: 0 }
      }
    };
  }

  const qs = new URLSearchParams(query).toString();
  const url = `${base}/internal/transactions${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-internal-key': env.internalApiKey
    }
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = { success: false, message: 'Invalid response from payment service' };
  }

  return { ok: response.ok, status: response.status, body };
}

exports.listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const { role, search, verification } = req.query;

    const filter = {};
    if (role && ['patient', 'doctor', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { firstName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { lastName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
      ];
    }
    if (verification && ['pending', 'approved', 'rejected', 'n_a'].includes(verification)) {
      filter.doctorVerificationStatus = verification;
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter)
    ]);

    const sanitized = items.map((u) => {
      const { password, ...rest } = u;
      if (
        rest.role === 'doctor' &&
        (rest.doctorVerificationStatus === undefined ||
          rest.doctorVerificationStatus === null)
      ) {
        rest.doctorVerificationStatus = 'pending';
      }
      return rest;
    });

    res.json({
      success: true,
      data: {
        items: sanitized,
        pagination: { page, limit, total }
      }
    });
  } catch (error) {
    console.error('Admin listUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list users',
      error: error.message
    });
  }
};

exports.verifyDoctor = async (req, res) => {
  try {
    const { userId, status } = req.body;

    if (!userId || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'userId and status (approved or rejected) are required'
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor user not found'
      });
    }

    user.doctorVerificationStatus = status;
    await user.save();

    await logAdminAction(req.user.id, 'VERIFY_DOCTOR', user._id, { status });

    res.json({
      success: true,
      message: `Doctor verification ${status}`,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Admin verifyDoctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor verification',
      error: error.message
    });
  }
};

exports.listTransactions = async (req, res) => {
  try {
    const query = {
      page: req.query.page,
      limit: req.query.limit,
      status: req.query.status
    };

    const { ok, status, body } = await fetchPaymentTransactions(query);

    if (!ok) {
      return res.status(status >= 400 ? status : 502).json(body);
    }

    res.json(body);
  } catch (error) {
    console.error('Admin listTransactions error:', error);
    res.status(502).json({
      success: false,
      message: 'Could not reach payment service',
      error: error.message
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAdmins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'admin' })
    ]);

    let revenue = 0;
    const payment = await fetchPaymentTransactions({ page: 1, limit: 1 });
    if (payment.ok && payment.body && payment.body.data) {
      revenue = Number(payment.body.data.revenue) || 0;
    }

    const pendingDoctorVerifications = await User.countDocuments({
      role: 'doctor',
      $or: [
        { doctorVerificationStatus: 'pending' },
        { doctorVerificationStatus: { $exists: false } },
        { doctorVerificationStatus: null }
      ]
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAdmins,
        revenue,
        pendingDoctorVerifications
      }
    });
  } catch (error) {
    console.error('Admin getStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load admin stats',
      error: error.message
    });
  }
};

exports.listActivity = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AdminAuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'email firstName lastName role')
        .populate('targetUserId', 'email firstName lastName role')
        .lean(),
      AdminAuditLog.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total }
      }
    });
  } catch (error) {
    console.error('Admin listActivity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list activity',
      error: error.message
    });
  }
};

exports.setUserActive = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive (boolean) is required'
      });
    }

    if (String(userId) === String(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own active status'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Modifying other admin accounts is not allowed'
      });
    }

    user.isActive = isActive;
    await user.save();

    await logAdminAction(req.user.id, isActive ? 'USER_UNBLOCK' : 'USER_BLOCK', user._id, {
      isActive
    });

    res.json({
      success: true,
      message: `User ${isActive ? 'enabled' : 'disabled'}`,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    console.error('Admin setUserActive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};
