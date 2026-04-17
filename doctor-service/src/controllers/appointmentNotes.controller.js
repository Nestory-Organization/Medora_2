/**
 * Appointment Notes Controller
 * Handles creation, retrieval, and update of appointment notes
 */

const mongoose = require('mongoose');
const axios = require('axios');
const env = require('../config/env');
const AppointmentNotes = require('../models/appointmentNotes.model');

// Create service clients
const appointmentServiceClient = axios.create({
  baseURL: env.appointmentServiceUrl?.replace(/\/$/, '') || 'http://appointment-service:4004',
  timeout: 8000
});

/**
 * Fetch appointment details from appointment-service
 */
const fetchAppointmentFromService = async (appointmentId, authToken) => {
  try {
    const response = await appointmentServiceClient.get(`/appointments/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching appointment ${appointmentId}:`, error.message);
    throw error;
  }
};

/**
 * Get appointment notes
 */
const getAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    // Verify appointment exists and belongs to this doctor
    try {
      const appointment = await fetchAppointmentFromService(appointmentId, authToken);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
    } catch (error) {
      return res.status(error.response?.status || 404).json({
        success: false,
        message: error.response?.data?.message || 'Appointment not found'
      });
    }

    // Get notes from database
    const notes = await AppointmentNotes.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      doctorId: new mongoose.Types.ObjectId(doctorId)
    });

    if (!notes) {
      return res.status(404).json({
        success: false,
        message: 'Notes not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notes retrieved successfully',
      data: notes
    });
  } catch (error) {
    console.error('Error getting appointment notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving notes'
    });
  }
};

/**
 * Create appointment notes
 */
const createAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { title, content, diagnosis, treatment, followUp, tags } = req.body;
    const doctorId = req.user.id;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    // Validate required fields
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Verify appointment exists
    try {
      const appointment = await fetchAppointmentFromService(appointmentId, authToken);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
    } catch (error) {
      return res.status(error.response?.status || 404).json({
        success: false,
        message: error.response?.data?.message || 'Appointment not found'
      });
    }

    // Check if notes already exist
    const existingNotes = await AppointmentNotes.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      doctorId: new mongoose.Types.ObjectId(doctorId)
    });

    if (existingNotes) {
      return res.status(400).json({
        success: false,
        message: 'Notes already exist for this appointment. Use PUT to update.'
      });
    }

    // Create notes
    const notes = new AppointmentNotes({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      title: title || 'Appointment Notes',
      content: content.trim(),
      diagnosis: diagnosis || null,
      treatment: treatment || null,
      followUp: followUp || null,
      tags: Array.isArray(tags) ? tags : []
    });

    await notes.save();

    return res.status(201).json({
      success: true,
      message: 'Notes created successfully',
      data: notes
    });
  } catch (error) {
    console.error('Error creating appointment notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating notes'
    });
  }
};

/**
 * Update appointment notes
 */
const updateAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { title, content, diagnosis, treatment, followUp, tags } = req.body;
    const doctorId = req.user.id;
    const authToken = req.headers.authorization?.replace('Bearer ', '');

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    // Validate content if provided
    if (content !== undefined && (!content || !content.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Content cannot be empty'
      });
    }

    // Verify appointment exists
    try {
      const appointment = await fetchAppointmentFromService(appointmentId, authToken);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }
    } catch (error) {
      return res.status(error.response?.status || 404).json({
        success: false,
        message: error.response?.data?.message || 'Appointment not found'
      });
    }

    // Find and update notes
    const notes = await AppointmentNotes.findOneAndUpdate(
      {
        appointmentId: new mongoose.Types.ObjectId(appointmentId),
        doctorId: new mongoose.Types.ObjectId(doctorId)
      },
      {
        $set: {
          title: title !== undefined ? title : undefined,
          content: content !== undefined ? content.trim() : undefined,
          diagnosis: diagnosis !== undefined ? diagnosis : undefined,
          treatment: treatment !== undefined ? treatment : undefined,
          followUp: followUp !== undefined ? followUp : undefined,
          tags: Array.isArray(tags) ? tags : undefined
        }
      },
      { new: true, runValidators: true }
    );

    if (!notes) {
      return res.status(404).json({
        success: false,
        message: 'Notes not found. Create notes first using POST.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notes updated successfully',
      data: notes
    });
  } catch (error) {
    console.error('Error updating appointment notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating notes'
    });
  }
};

/**
 * Delete appointment notes
 */
const deleteAppointmentNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user.id;

    // Validate appointment ID
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    // Find and delete notes
    const notes = await AppointmentNotes.findOneAndDelete({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
      doctorId: new mongoose.Types.ObjectId(doctorId)
    });

    if (!notes) {
      return res.status(404).json({
        success: false,
        message: 'Notes not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notes deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment notes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting notes'
    });
  }
};

module.exports = {
  getAppointmentNotes,
  createAppointmentNotes,
  updateAppointmentNotes,
  deleteAppointmentNotes
};
