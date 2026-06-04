const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const DoctorProfile = require('../models/doctorProfile.model');
const Availability = require('../models/availability.model');
const Appointment = require('../models/appointment.model');

const getDoctorObjectId = (req) => {
  if (!req.user?.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(req.user.id);
};

// Extract doctorId from JWT token in Authorization header
const extractDoctorIdFromJWT = (req) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return null;
    }

    return new mongoose.Types.ObjectId(decoded.id);
  } catch (error) {
    return null;
  }
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

    // Log for debugging visibility
    console.log(`[DoctorService] Found ${appointments.length} appointments for doctor ${doctorId}`);

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
    const { status, declineReason, doctorNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment identifier'
      });
    }

    // Map status values to what the appointment model accepts
    const statusMap = {
      'ACCEPTED': 'PENDING_PAYMENT',
      'CONFIRMED': 'CONFIRMED',
      'REJECTED': 'CANCELLED',
      'CANCELLED': 'CANCELLED'
    };

    const mappedStatus = statusMap[status] || status;

    if (!['PENDING_DOCTOR_APPROVAL', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(mappedStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const appointment = await Appointment.findOne({ _id: id, doctorId });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found for this doctor'
      });
    }

    if (appointment.status !== 'PENDING_DOCTOR_APPROVAL') {
      return res.status(400).json({
        success: false,
        message: `Cannot update appointment with status ${appointment.status}. Only PENDING_DOCTOR_APPROVAL can be accepted or rejected.`
      });
    }

    appointment.status = mappedStatus;

    if (mappedStatus === 'PENDING_PAYMENT') {
      appointment.paymentStatus = 'UNPAID';
    } else if (mappedStatus === 'CANCELLED') {
      appointment.paymentStatus = 'CANCELLED';
    }

    if (doctorNote) {
      appointment.doctorNote = doctorNote.trim();
    }

    if (declineReason) {
      appointment.declineReason = declineReason.trim();
    }

    await appointment.save();

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

    // Attempt to set doctorName if it's missing on the appointment
    if (!appointment.doctorName || appointment.doctorName === 'Unknown Doctor') {
      const profile = await DoctorProfile.findOne({ doctorId }).lean();
      if (profile) {
        appointment.doctorName = `${profile.firstName} ${profile.lastName}`;
      }
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

const createTelemedicineSession = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Security check: Only the assigned doctor can generate the session
    if (appointment.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only the assigned doctor can create a session'
      });
    }

    // Generate a unique session ID if not already exists
    const sessionId = appointment.telemedicine?.sessionId || `medora-${appointmentId}-${Math.random().toString(36).substring(2, 9)}`;
    const meetingLink = `https://meet.jit.si/${sessionId}`;

    appointment.telemedicine = {
      meetingLink,
      sessionId,
      requestedAt: new Date()
    };

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Telemedicine session created successfully',
      data: {
        meetingLink,
        sessionId,
        appointmentId
      }
    });
  } catch (error) {
    console.error('Create telemedicine session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create telemedicine session'
    });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    // For public calls from appointment-service: accept doctorId from query
    // For authenticated doctor calls: extract from JWT or req.user
    let doctorId = req.query.doctorId || getDoctorObjectId(req) || extractDoctorIdFromJWT(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const { date } = req.query;
    const query = { doctorId };

    if (date) {
      const normalizedDate = new Date(date);
      if (!Number.isNaN(normalizedDate.getTime())) {
        query.date = normalizedDate;
      }
    }

    const availability = await Availability.find(query)
      .sort({ date: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch availability'
    });
  }
};

const markSlotBooked = async (req, res) => {
  try {
    const { doctorId, date, startTime } = req.body;

    if (!doctorId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, date, and startTime are required'
      });
    }

    const normalizedDate = new Date(date);
    const availability = await Availability.findOne({ doctorId, date: normalizedDate });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found for this date'
      });
    }

    const slotIndex = availability.slots.findIndex(s => s.startTime === startTime);
    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    availability.slots[slotIndex].isBooked = true;
    await availability.save();

    return res.status(200).json({
      success: true,
      message: 'Slot marked as booked'
    });
  } catch (error) {
    console.error('Mark slot booked error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark slot as booked'
    });
  }
};

const releaseSlot = async (req, res) => {
  try {
    const { doctorId, date, startTime } = req.body;

    if (!doctorId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'doctorId, date, and startTime are required'
      });
    }

    const normalizedDate = new Date(date);
    const availability = await Availability.findOne({ doctorId, date: normalizedDate });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found for this date'
      });
    }

    const slotIndex = availability.slots.findIndex(s => s.startTime === startTime);
    if (slotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    availability.slots[slotIndex].isBooked = false;
    await availability.save();

    return res.status(200).json({
      success: true,
      message: 'Slot released'
    });
  } catch (error) {
    console.error('Release slot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to release slot'
    });
  }
};

const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = getDoctorObjectId(req);

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const profile = await DoctorProfile.findOne({ doctorId });

    if (!profile) {
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
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile'
    });
  }
};

const getDoctorProfileById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor identifier'
      });
    }

    const profile = await DoctorProfile.findOne({ doctorId }).lean();

    if (!profile) {
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
    console.error('Get profile by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor profile'
    });
  }
};

module.exports = {
  createDoctorProfile,
  updateDoctorProfile,
  getDoctorProfile,
  getDoctorProfileById,
  setAvailability,
  getDoctorAvailability,
  markSlotBooked,
  releaseSlot,
  getAssignedAppointments,
  updateAppointmentStatus,
  addPrescription,
  createTelemedicineSession
};
