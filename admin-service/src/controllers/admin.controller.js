const DoctorProfile = require('../models/doctorProfile.model');
const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../config/env');

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
    const authResponse = await axios.get(`${env.authServiceUrl}/auth/users`, {
      headers: {
        Authorization: req.headers.authorization || ''
      },
      timeout: 8000
    });

    const users = authResponse?.data?.data || [];

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to retrieve users from auth service';

    return res.status(statusCode).json({
      success: false,
      message
    });
  }
};

module.exports = {
  getAllDoctorsProfiles,
  verifyDoctorProfile,
  getAllUsers
};
