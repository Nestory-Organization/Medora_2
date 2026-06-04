const DoctorProfile = require('../models/doctorProfile.model');

const getHealth = async (req, res) => {
  console.log('[System] GET /health');
  return res.status(200).json({
    service: req.app.locals.serviceName,
    status: 'ok',
    timestamp: new Date().toISOString()
  });
};

const getStatus = async (req, res) => {
  console.log('[System] GET /status');
  return res.status(200).json({
    message: req.app.locals.serviceName + ' is operational'
  });
};

// Internal system endpoints for Admin Service
const getAllDoctors = async (req, res) => {
  console.log('[System] GET /doctors - fetching all doctor profiles');
  try {
    const profiles = await DoctorProfile.find({});
    console.log(`[System] Found ${profiles.length} doctor profiles`);
    return res.status(200).json({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('[System] Error fetching doctors:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching doctors'
    });
  }
};

const verifyDoctor = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(`[System] PATCH verify - id=${id}, status=${status}, params=`, req.params);

  try {
    const profile = await DoctorProfile.findOneAndUpdate(
      { doctorId: id },
      { isVerified: status },
      { new: true }
    );

    if (!profile) {
      const allProfiles = await DoctorProfile.find({});
      console.log(`[System] Doctor profile not found for id: ${id}. Available IDs:`, allProfiles.map(p => ({_id: p._id, doctorId: p.doctorId})));
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('[System] Error verifying doctor:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error verifying doctor'
    });
  }
};

module.exports = {
  getHealth,
  getStatus,
  getAllDoctors,
  verifyDoctor
};

