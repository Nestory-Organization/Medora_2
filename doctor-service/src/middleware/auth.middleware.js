const jwt = require('jsonwebtoken');
const env = require('../config/env');
const DoctorProfile = require('../models/doctorProfile.model');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const authorizeDoctor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not authenticated'
    });
  }

  if (req.user.role !== 'doctor') {
    return res.status(403).json({
      success: false,
      message: 'Only doctors can access this resource'
    });
  }

  return next();
};

const checkDoctorVerified = async (req, res, next) => {
  if (!req.user || req.user.role !== 'doctor') {
    return next();
  }

  try {
    const profile = await DoctorProfile.findOne({ doctorId: req.user.id });
    
    if (!profile) {
      // If profile doesn't exist, they can still access the profile creation endpoint
      // We'll handle this refined check in the routes/controllers
      return next();
    }

    if (!profile.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your doctor profile is pending admin approval'
      });
    }

    return next();
  } catch (error) {
    console.error('Check verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking doctor verification status'
    });
  }
};

module.exports = {
  authenticate,
  authorizeDoctor,
  checkDoctorVerified
};
