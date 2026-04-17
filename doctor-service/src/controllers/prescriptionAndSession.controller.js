/**
 * Prescription & Telemedicine Session Management Controller
 * Handles post-appointment care and virtual consultations
 */

const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../config/env');
const Appointment = require('../models/appointment.model');

// Create a service client for patient-service
const patientServiceClient = axios.create({
  baseURL: env.patientServiceUrl?.replace(/\/$/, '') || 'http://localhost:4002',
  timeout: 8000
});

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
        message: 'Appointment not found in doctor-service'
      });
    }

    // Allow adding prescription to confirmed or completed appointments
    if (!['CONFIRMED', 'COMPLETED'].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Prescription can only be added to confirmed or completed appointments (current status: ${appointment.status})`
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

    // Add to prescriptions array
    if (!appointment.prescriptions) {
      appointment.prescriptions = [];
    }
    appointment.prescriptions.push(prescription);

    await appointment.save();

    // Sync prescription to patient-service
    try {
      const doctorInfo = appointment.doctorName ? appointment.doctorName.split(' ') : ['Unknown', 'Doctor'];
      await patientServiceClient.post('/prescriptions', {
        patientId: appointment.patientId.toString(),
        doctorId: appointment.doctorId.toString(),
        doctorName: `${doctorInfo[0]} ${doctorInfo[1] || ''}`.trim(),
        medicines: prescription.medicines.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration,
          instructions: med.instructions
        })),
        notes: prescription.notes,
        prescriptionDate: prescription.createdAt
      });
      console.log(`[Prescription Sync] Prescription synced to patient-service for appointment ${appointmentId}`);
    } catch (syncError) {
      console.warn(`[Prescription Sync] Failed to sync prescription to patient-service:`, syncError.message);
      // Don't fail the request if sync fails - the prescription is still created in doctor-service
    }

    return res.status(201).json({
      success: true,
      message: 'Prescription added successfully',
      data: {
        appointmentId: appointment._id,
        patientId: appointment.patientId,
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
        message: 'Invalid appointment ID format'
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
        message: 'No prescriptions found for this appointment. Please add a prescription first.'
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
      const sessionId = `medora-${appointmentId}-${Date.now().toString(36)}`;
      const meetingLink = `https://meet.jit.si/${sessionId}`;

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

module.exports = {
  addPrescriptionToAppointment,
  getPrescriptionDetails,
  initializeTelemedicineSession,
  getTelemedicineSession,
  completeAppointment,
  addPatientReport
};
