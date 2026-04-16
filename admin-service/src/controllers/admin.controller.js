const DoctorProfile = require('../models/doctorProfile.model');
const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../config/env');

const createServiceClient = (baseURL, timeout) =>
  axios.create({
    baseURL: String(baseURL || '').replace(/\/$/, ''),
    timeout
  });

const authApi = createServiceClient(env.authServiceUrl, env.serviceRequestTimeoutMs);
const paymentApi = createServiceClient(
  env.paymentServiceUrl,
  env.serviceRequestTimeoutMs
);

const escapeRegex = (value) =>
  String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false;
    }
  }

  return null;
};

const mapAuthServiceError = (error, fallbackMessage) => {
  if (error.response) {
    return {
      statusCode: error.response.status || 502,
      message: error.response.data?.message || fallbackMessage
    };
  }

  return {
    statusCode: 502,
    message: fallbackMessage
  };
};

const fetchUsersFromAuth = async (authHeader) => {
  const response = await authApi.get('/auth/users', {
    headers: {
      Authorization: authHeader || ''
    }
  });

  return Array.isArray(response.data?.data) ? response.data.data : [];
};

const fetchTransactionsFromPayment = async (query = {}) => {
  if (!env.internalApiKey) {
    return {
      items: [],
      pagination: { page: 1, limit: 20, total: 0 },
      revenue: 0
    };
  }

  const response = await paymentApi.get('/internal/transactions', {
    params: query,
    headers: {
      'x-internal-key': env.internalApiKey
    }
  });

  return response.data?.data || {
    items: [],
    pagination: { page: 1, limit: 20, total: 0 },
    revenue: 0
  };
};

const withDefaultVerification = (users) =>
  users.map((user) => {
    const clone = { ...user };

    if (
      clone.role === 'doctor' &&
      (clone.doctorVerificationStatus === undefined ||
        clone.doctorVerificationStatus === null)
    ) {
      clone.doctorVerificationStatus = 'pending';
    }

    return clone;
  });

const summarizeReports = (users, transactions, doctors) => {
  const usersByRole = users.reduce(
    (acc, user) => {
      const role = ['patient', 'doctor', 'admin'].includes(user.role)
        ? user.role
        : 'patient';
      acc[role] += 1;
      return acc;
    },
    { patient: 0, doctor: 0, admin: 0 }
  );

  const usersByStatus = users.reduce(
    (acc, user) => {
      if (user.isActive) {
        acc.active += 1;
      } else {
        acc.disabled += 1;
      }
      return acc;
    },
    { active: 0, disabled: 0 }
  );

  const doctorsByVerification = doctors.reduce(
    (acc, doctor) => {
      if (doctor.isVerified) {
        acc.verified += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { verified: 0, pending: 0 }
  );

  const transactionsByStatus = transactions.reduce((acc, tx) => {
    const normalized = String(tx.status || '').toUpperCase();
    if (!acc[normalized]) {
      acc[normalized] = 0;
    }
    acc[normalized] += 1;
    return acc;
  }, {});

  return {
    usersByRole,
    usersByStatus,
    doctorsByVerification,
    transactionsByStatus
  };
};
// Get all doctors profiles
const getAllDoctorsProfiles = async (req, res) => {
  try {
    const doctorResponse = await axios.get(`${env.doctorServiceUrl}/system/doctors`, {
      headers: {
        Authorization: req.headers.authorization || ''
      },
      timeout: 8000
    });

    const profiles = doctorResponse?.data?.data || [];
    return res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get all doctors profiles error:', error);
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to retrieve doctors profiles from doctor service';

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

// Approve a doctor profile
const verifyDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Verification status (boolean) is required'
      });
    }

    const doctorResponse = await axios.patch(
      `${env.doctorServiceUrl}/system/doctors/${doctorId}/verify`,
      { status },
      {
        headers: {
          Authorization: req.headers.authorization || ''
        },
        timeout: 8000
      }
    );

    return res.status(200).json({
      success: true,
      message: `Doctor profile ${status ? 'verified' : 'unverified'} successfully`,
      data: doctorResponse.data.data
    });
  } catch (error) {
    console.error('Verify doctor profile error:', error);
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to update doctor verification status in doctor service';

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

// Get all users (Patients/Doctors)
const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const role = String(req.query.role || '').trim().toLowerCase();
    const search = String(req.query.search || '').trim();
    const isActive = parseBoolean(req.query.isActive);

    let users = await fetchUsersFromAuth(req.headers.authorization || '');
    users = withDefaultVerification(users);

    if (['patient', 'doctor', 'admin'].includes(role)) {
      users = users.filter((user) => user.role === role);
    }

    if (isActive !== null) {
      users = users.filter((user) => Boolean(user.isActive) === isActive);
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      users = users.filter((user) =>
        pattern.test(user.email || '') ||
        pattern.test(user.firstName || '') ||
        pattern.test(user.lastName || '')
      );
    }

    const total = users.length;
    const pagedUsers = users.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: pagedUsers,
      meta: {
        page,
        limit,
        total
      }
    });
  } catch (error) {
    const mapped = mapAuthServiceError(
      error,
      'Failed to retrieve users from auth service'
    );

    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message
    });
  }
};

const setUserActiveState = async (req, res) => {
  try {
    const { userId } = req.params;
    const isActive = parseBoolean(req.body?.isActive);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user identifier'
      });
    }

    if (isActive === null) {
      return res.status(400).json({
        success: false,
        message: 'isActive (boolean) is required'
      });
    }

    const authResponse = await authApi.patch(
      `/admin/users/${encodeURIComponent(userId)}/active`,
      { isActive },
      {
        headers: {
          Authorization: req.headers.authorization || ''
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: authResponse.data?.message || `User ${isActive ? 'enabled' : 'disabled'}`,
      data: authResponse.data?.data || null
    });
  } catch (error) {
    const mapped = mapAuthServiceError(error, 'Failed to update user status');
    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const status = String(req.query.status || '').trim().toLowerCase();

    const data = await fetchTransactionsFromPayment({
      page,
      limit,
      status: status || undefined
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    const mapped = mapAuthServiceError(
      error,
      'Failed to retrieve transactions from payment service'
    );
    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message
    });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const [users, doctors, transactionsData] = await Promise.all([
      fetchUsersFromAuth(req.headers.authorization || ''),
      DoctorProfile.find({}).lean(),
      fetchTransactionsFromPayment({ page: 1, limit: 1 })
    ]);

    const totalUsers = users.length;
    const totalDoctors = users.filter((user) => user.role === 'doctor').length;
    const revenue = Number(transactionsData.revenue || 0);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        revenue,
        pendingDoctorVerifications: doctors.filter((doc) => !doc.isVerified).length
      }
    });
  } catch (error) {
    const mapped = mapAuthServiceError(error, 'Failed to retrieve dashboard stats');
    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message
    });
  }
};

const getReports = async (req, res) => {
  try {
    const [users, doctors, transactionsData] = await Promise.all([
      fetchUsersFromAuth(req.headers.authorization || ''),
      DoctorProfile.find({}).lean(),
      fetchTransactionsFromPayment({ page: 1, limit: 200 })
    ]);

    const report = summarizeReports(users, transactionsData.items || [], doctors);

    return res.status(200).json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        report,
        revenue: Number(transactionsData.revenue || 0)
      }
    });
  } catch (error) {
    const mapped = mapAuthServiceError(error, 'Failed to generate reports');
    return res.status(mapped.statusCode).json({
      success: false,
      message: mapped.message
    });
  }
};

module.exports = {
  getAllDoctorsProfiles,
  verifyDoctorProfile,
  getAllUsers,
  setUserActiveState,
  getTransactions,
  getDashboardStats,
  getReports
};
