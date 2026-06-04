/**
 * Prescription & Telemedicine Session Management Controller
 * Handles post-appointment care and virtual consultations
 */

const mongoose = require('mongoose');
const axios = require('axios');
const Appointment = require('../models/appointment.model');
const env = require('../config/env');

/**
 * Add prescription to an appointment
 */
const addPrescriptionToAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { medicines, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one medicine is required'
      });
    }

    // Validate medicine format
    const invalidMedicine = medicines.find(med => {
      return !med.name || !med.dosage || !med.frequency || !med.duration;
    });

    if (invalidMedicine) {
      return res.status(400).json({
        success: false,
        message: 'Each medicine must include: name, dosage, frequency, duration'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Allow adding prescription to CONFIRMED or COMPLETED appointments
    if (!['CONFIRMED', 'COMPLETED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Prescription can only be added to confirmed or completed appointments. Current status: ${appointment.status}'
      });
    }

    // Create prescription object
    const prescription = {
      medicines: medicines.map(med => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration.trim(),
        instructions: med.instructions ? med.instructions.trim() : null
      })),
      notes: notes ? notes.trim() : null,
      createdAt: new Date()
    };

    // Add to prescriptions array in doctor-service
    if (!appointment.prescriptions) {
      appointment.prescriptions = [];
    }
    appointment.prescriptions.push(prescription);

    await appointment.save();

    // Sync prescription to patient-service
    try {
      const patientServiceUrl = env.patientServiceUrl.replace(/\/+$/, '');
      const syncUrl = '/api/patients//prescriptions';

      console.log('[Prescription] Syncing to patient-service: ${syncUrl}');

      const syncResponse = await axios.post(
        syncUrl,
        {
          medicines: prescription.medicines,
          notes: prescription.notes,
          doctorId: appointment.doctorId,
          doctorSpecialty: appointment.specialty,
          prescriptionDate: prescription.createdAt
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        }
      );

      console.log('[Prescription] Synced successfully to patient-service');
    } catch (syncError) {
      console.error('[Prescription] Warning: Failed to sync to patient-service:', syncError.message);
      // Continue anyway - don't block the response if sync fails
    }

    return res.status(201).json({
      success: true,
      message: 'Prescription added successfully',
      data: {
        appointmentId: appointment._id,
        prescriptionId: appointment.prescriptions[appointment.prescriptions.length - 1]._id,
        medicines: prescription.medicines,
        notes: prescription.notes
      }
    });
  } catch (error) {
    console.error('Add prescription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add prescription'
    });
  }
};

/**
 * Get prescription for an appointment
 */
const getPrescriptionDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!appointment.prescriptions || appointment.prescriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No prescriptions found for this appointment'
      });
    }

    const latestPrescription = appointment.prescriptions[appointment.prescriptions.length - 1];

    return res.status(200).json({
      success: true,
      data: {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        prescription: {
          medicines: latestPrescription.medicines,
          notes: latestPrescription.notes,
          prescribedAt: latestPrescription.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription'
    });
  }
};

/**
 * Create or get telemedicine session for an appointment
 */
const initializeTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { generateNewLink = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment is confirmed
    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be confirmed to start telemedicine session'
      });
    }

    // Check if appointment is within valid time range (30 mins before to appointment end time)
    const now = new Date();
    const appointmentDateTime = new Date(appointment.appointmentDate);
    const [hours, minutes] = appointment.startTime.split(':');
    appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

    const thirtyMinutesBefore = new Date(appointmentDateTime.getTime() - 30 * 60000);
    const endTime = new Date(appointmentDateTime.getTime() + 30 * 60000); // Assume 30-min appointment

    if (now < thirtyMinutesBefore) {
      return res.status(400).json({
        success: false,
        message: 'Telemedicine session can be started 30 minutes before appointment',
        availableAt: thirtyMinutesBefore.toISOString()
      });
    }

    if (now > endTime) {
      return res.status(400).json({
        success: false,
        message: 'Appointment time has passed'
      });
    }

    // Generate or reuse session
    if (!appointment.telemedicine || !appointment.telemedicine.sessionId || generateNewLink) {
      const sessionId = 'medora--';
      const meetingLink = 'https://meet.jit.si/';

      appointment.telemedicine = {
        sessionId,
        meetingLink,
        requestedAt: new Date(),
        participantCount: 0
      };

      await appointment.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Telemedicine session ready',
      data: {
        appointmentId: appointment._id,
        sessionId: appointment.telemedicine.sessionId,
        meetingLink: appointment.telemedicine.meetingLink,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        requestedAt: appointment.telemedicine.requestedAt
      }
    });
  } catch (error) {
    console.error('Initialize telemedicine error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize telemedicine session'
    });
  }
};

/**
 * Get telemedicine session details
 */
const getTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (!appointment.telemedicine || !appointment.telemedicine.sessionId) {
      return res.status(404).json({
        success: false,
        message: 'No telemedicine session for this appointment'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        appointmentId: appointment._id,
        sessionId: appointment.telemedicine.sessionId,
        meetingLink: appointment.telemedicine.meetingLink,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        requestedAt: appointment.telemedicine.requestedAt
      }
    });
  } catch (error) {
    console.error('Get telemedicine session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch telemedicine session'
    });
  }
};

/**
 * Mark appointment as completed
 */
const completeAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { completionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already marked as completed'
      });
    }

    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed appointments can be completed'
      });
    }

    appointment.status = 'COMPLETED';
    appointment.completedAt = new Date();

    if (completionNotes) {
      appointment.completionNotes = completionNotes.trim();
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment marked as completed',
      data: {
        appointmentId: appointment._id,
        status: appointment.status,
        completedAt: appointment.completedAt
      }
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete appointment'
    });
  }
};

/**
 * Add patient report/documentation to appointment
 */
const addPatientReport = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { title, fileUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    if (!title || !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and file URL are required'
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const report = {
      title: title.trim(),
      fileUrl: fileUrl.trim(),
      uploadedAt: new Date()
    };

    if (!appointment.patientReports) {
      appointment.patientReports = [];
    }

    appointment.patientReports.push(report);
    await appointment.save();

    return res.status(201).json({
      success: true,
      message: 'Patient report added successfully',
      data: {
        appointmentId: appointment._id,
        report
      }
    });
  } catch (error) {
    console.error('Add patient report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add patient report'
    });
  }
};

/**
 * Get all prescriptions for a patient
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID'
      });
    }

    const appointments = await Appointment.find({
      patientId: patientId,
      'prescriptions.0': { $exists: true }
    }).lean();

    const prescriptions = [];
    for (const appointment of appointments) {
      if (appointment.prescriptions && Array.isArray(appointment.prescriptions)) {
        for (const prescription of appointment.prescriptions) {
          prescriptions.push({
            _id: prescription._id,
            appointmentId: appointment._id,
            doctorId: appointment.doctorId,
            doctorName: appointment.doctorName || 'Unknown Doctor',
            doctorSpecialty: appointment.specialty,
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            medicines: prescription.medicines || [],
            notes: prescription.notes,
            prescriptionDate: prescription.createdAt,
            createdAt: prescription.createdAt
          });
        }
      }
    }

    prescriptions.sort((a, b) => new Date(b.prescriptionDate) - new Date(a.prescriptionDate));

    return res.status(200).json({
      success: true,
      message: 'Patient prescriptions fetched successfully',
      data: prescriptions,
      count: prescriptions.length
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions'
    });
  }
};

module.exports = {
  addPrescriptionToAppointment,
  getPrescriptionDetails,
  getPatientPrescriptions,
  initializeTelemedicineSession,
  getTelemedicineSession,
  completeAppointment,
  addPatientReport
};
