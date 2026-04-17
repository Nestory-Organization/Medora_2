const mongoose = require('mongoose');
const DoctorProfile = require('../models/doctorProfile.model');
const Availability = require('../models/availability.model');

const searchDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty, date } = req.query;

    if (!specialty || specialty.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Specialty is required'
      });
    }

    const specialtyQuery = {
      specialization: {
        $regex: specialty.trim(),
        $options: 'i'
      }
    };

    // Keep verified doctors as first preference; if none exist, fall back to all doctors in DB.
    let doctors = await DoctorProfile.find({
      ...specialtyQuery,
      isVerified: true
    })
      .select('doctorId firstName lastName specialization consultationFee bio clinicAddress qualification yearsOfExperience isVerified')
      .lean();

    if (doctors.length === 0) {
      doctors = await DoctorProfile.find(specialtyQuery)
        .select('doctorId firstName lastName specialization consultationFee bio clinicAddress qualification yearsOfExperience isVerified')
        .lean();
    }

    if (doctors.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No doctors found for the specified specialty',
        data: [],
        count: 0
      });
    }

    let enrichedDoctors = doctors.map(doctor => ({
      doctorId: String(doctor.doctorId),
      name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      yearsOfExperience: doctor.yearsOfExperience,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio,
      clinicAddress: doctor.clinicAddress,
      isVerified: doctor.isVerified === true
    }));

    // If date is provided, fetch availability slots
    if (date) {
      const queryDate = new Date(date);
      if (!Number.isNaN(queryDate.getTime())) {
        const availabilities = await Availability.find({
          doctorId: { $in: doctors.map(d => d.doctorId) },
          date: {
            $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
            $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1)
          }
        }).lean();

        const availabilityMap = {};
        availabilities.forEach(avail => {
          availabilityMap[String(avail.doctorId)] = avail.slots || [];
        });

        enrichedDoctors = enrichedDoctors.map(doctor => ({
          ...doctor,
          availableSlots: availabilityMap[String(doctor.doctorId)] || []
        }));
      }
    }

    return res.status(200).json({
      success: true,
      specialty: specialty.trim(),
      count: enrichedDoctors.length,
      data: enrichedDoctors
    });
  } catch (error) {
    console.error('Search doctors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to search doctors'
    });
  }
};

const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId || doctorId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID is required'
      });
    }

    let doctor = null;
    const trimmedId = doctorId.trim();

    // Try to find by ObjectId first (if it's a valid ObjectId format)
    if (mongoose.Types.ObjectId.isValid(trimmedId)) {
      doctor = await DoctorProfile.findOne({ 
        doctorId: new mongoose.Types.ObjectId(trimmedId) 
      }).lean();
    }

    // If not found and it looks like an ObjectId string, try direct comparison
    if (!doctor) {
      doctor = await DoctorProfile.findOne({ 
        doctorId: trimmedId 
      }).lean();
    }

    if (!doctor) {
      console.warn(`[getDoctorProfile] Doctor not found for ID: ${trimmedId}`);
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        doctorId: doctor.doctorId,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        yearsOfExperience: doctor.yearsOfExperience,
        consultationFee: doctor.consultationFee,
        bio: doctor.bio,
        clinicAddress: doctor.clinicAddress,
        phone: doctor.phone,
        isVerified: doctor.isVerified,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      }
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile',
      error: error.message
    });
  }
};

const getVerifiedDoctors = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
    const doctors = await DoctorProfile.find({ isVerified: true })
      .select('doctorId firstName lastName specialization consultationFee yearsOfExperience')
      .skip(skip)
      .limit(Math.min(100, parseInt(limit)))
      .lean();

    const total = await DoctorProfile.countDocuments({ isVerified: true });

    return res.status(200).json({
      success: true,
      data: doctors.map(doctor => ({
        doctorId: doctor.doctorId,
        name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
        specialization: doctor.specialization,
        consultationFee: doctor.consultationFee,
        yearsOfExperience: doctor.yearsOfExperience
      })),
      pagination: {
        page: Math.max(1, parseInt(page)),
        limit: Math.min(100, parseInt(limit)),
        total,
        totalPages: Math.ceil(total / Math.min(100, parseInt(limit)))
      }
    });
  } catch (error) {
    console.error('Get verified doctors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch verified doctors'
    });
  }
};

module.exports = {
  searchDoctorsBySpecialty,
  getDoctorProfile,
  getVerifiedDoctors
};
