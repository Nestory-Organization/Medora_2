const mongoose = require('mongoose');
const DoctorProfile = require('../models/doctorProfile.model');
const Availability = require('../models/availability.model');
const Appointment = require('../models/appointment.model');

const getDoctorObjectId = (req) => {
  if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(req.user.id);
};

const createDoctorProfile = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      specialization,
      qualification,
      yearsOfExperience,
      consultationFee,
      bio,
      clinicAddress
    } = req.body;

    if (!firstName || !lastName || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and specialization are required'
      });
    }

    const existingProfile = await DoctorProfile.findOne({ doctorId });
    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: 'Doctor profile already exists'
      });
    }

    const profile = await DoctorProfile.create({
      doctorId,
      firstName,
      lastName,
      phone: phone || null,
      specialization,
      qualification: qualification || null,
      yearsOfExperience: yearsOfExperience || 0,
      consultationFee: consultationFee || 0,
      bio: bio || null,
      clinicAddress: clinicAddress || null
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: profile
    });
  } catch (error) {
    console.error('Create profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create doctor profile'
    });
  }
};

const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'specialization',
      'qualification',
      'yearsOfExperience',
      'consultationFee',
      'bio',
      'clinicAddress'
    ];

    const payload = {};
    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    });

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No profile fields provided for update'
      });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { doctorId },
      { $set: payload },
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
      message: 'Doctor profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile'
    });
  }
};

const setAvailability = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const { date, slots } = req.body;

    if (!date || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Date and at least one time slot are required'
      });
    }

    const invalidSlot = slots.find((slot) => !slot.startTime || !slot.endTime);
    if (invalidSlot) {
      return res.status(400).json({
        success: false,
        message: 'Each slot must include startTime and endTime'
      });
    }

    const normalizedDate = new Date(date);
    if (Number.isNaN(normalizedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    const availability = await Availability.findOneAndUpdate(
      { doctorId, date: normalizedDate },
      {
        $set: {
          slots
        }
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Availability saved successfully',
      data: availability
    });
  } catch (error) {
    console.error('Set availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save availability'
    });
  }
};

const getAssignedAppointments = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const query = { doctorId };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: 1, startTime: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment identifier'
      });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either accepted or rejected'
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, doctorId },
      { $set: { status } },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found for this doctor'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment status'
    });
  }
};

const addPrescription = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const { appointmentId, medicines, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment identifier'
      });
    }

    if (!appointmentId || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'appointmentId and at least one medicine are required'
      });
    }

    const invalidMedicine = medicines.find(
      (item) => !item.name || !item.dosage || !item.frequency || !item.duration
    );

    if (invalidMedicine) {
      return res.status(400).json({
        success: false,
        message: 'Each medicine requires name, dosage, frequency, and duration'
      });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found for this doctor'
      });
    }

    appointment.prescriptions.push({
      medicines,
      notes: notes || null
    });

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: 'Prescription added successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Add prescription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add prescription'
    });
  }
};

module.exports = {
  createDoctorProfile,
  updateDoctorProfile,
  setAvailability,
  getAssignedAppointments,
  updateAppointmentStatus,
  addPrescription
};
