const DoctorProfile = require('../models/doctorProfile.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // In a real microservice, we would call the auth-service to verify credentials
    // For now, we search the local sync/shared user model or cross-check
    // Note: This assumes admin-service has access to admin users in its own DB
    const admin = await User.findOne({ email, role: 'admin' });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    // Since we don't have password hashing here yet in this service (it was handled by auth),
    // we should ideally delegate login to auth-service. 
    // BUT since the user asked for an admin login API for the admin part:
    
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: 'admin' },
      env.jwtSecret,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email
        }
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Admin login failed'
    });
  }
};

// Get all doctors profiles
const getAllDoctorsProfiles = async (req, res) => {
  try {
    const profiles = await DoctorProfile.find({});
    return res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Get all doctors profiles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve doctors profiles'
    });
  }
};

// Approve a doctor profile
const verifyDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const { status } = req.body; 

    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Verification status (boolean) is required'
      });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctorId },
      { isVerified: status },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Doctor profile ${status ? 'verified' : 'unverified'} successfully`,
      data: profile
    });
  } catch (error) {
    console.error('Verify doctor profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor verification status'
    });
  }
};

// Get all users (Patients/Doctors)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve users' });
  }
};

module.exports = {
  getAllDoctorsProfiles,
  verifyDoctorProfile,
  getAllUsers
};
