const Telemedicine = require('../models/telemedicine.model');
const Appointment = require('../models/appointment.model');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Generate unique session and room IDs
const generateSessionIds = () => ({
  sessionId: `session_${uuidv4().substring(0, 8)}`,
  roomId: `room_${uuidv4().substring(0, 8)}`
});

// Verify payment status from appointment
const verifyPaymentStatus = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return { success: false, message: 'Appointment not found' };
    }

    // Check if appointment status is CONFIRMED and payment is PAID
    if (appointment.status !== 'CONFIRMED' || appointment.paymentStatus !== 'PAID') {
      return {
        success: false,
        message: 'Cannot start telemedicine session. Appointment must be confirmed and payment must be completed.',
        appointmentStatus: appointment.status,
        paymentStatus: appointment.paymentStatus
      };
    }

    return { success: true, appointment };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { success: false, message: 'Error verifying payment status' };
  }
};

// Get or create telemedicine session
const getOrCreateTelemedicineSession = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user?.id;

    // Verify payment first
    const paymentCheck = await verifyPaymentStatus(appointmentId);
    if (!paymentCheck.success) {
      return res.status(402).json({
        success: false,
        message: paymentCheck.message,
        data: {
          appointmentStatus: paymentCheck.appointmentStatus,
          paymentStatus: paymentCheck.paymentStatus
        }
      });
    }

    // Check if telemedicine session already exists
    let session = await Telemedicine.findOne({ appointmentId });

    if (!session) {
      // Create new session
      const { sessionId, roomId } = generateSessionIds();

      session = new Telemedicine({
        appointmentId,
        patientId: paymentCheck.appointment.patientId,
        doctorId,
        sessionId,
        roomId,
        status: 'SCHEDULED',
        paymentVerified: true
      });

      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Telemedicine session retrieved',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        sessionId: session.sessionId,
        roomId: session.roomId,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        patientJoined: session.patientJoined,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Get telemedicine session error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve telemedicine session',
      data: null
    });
  }
};

// Initiate telemedicine call
const initiateTelemedicineCall = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { sessionId: customSessionId } = req.body || {};
    const doctorId = req.user?.id;

    // Verify payment first
    const paymentCheck = await verifyPaymentStatus(appointmentId);
    if (!paymentCheck.success) {
      return res.status(402).json({
        success: false,
        message: paymentCheck.message,
        data: {
          appointmentStatus: paymentCheck.appointmentStatus,
          paymentStatus: paymentCheck.paymentStatus
        }
      });
    }

    // Get or create session
    let session = await Telemedicine.findOne({ appointmentId });

    if (!session) {
      // Use custom sessionId if provided, otherwise generate
      const sessionId = customSessionId || generateSessionIds().sessionId;
      // Use same ID for both sessionId and roomId for easy sharing
      session = new Telemedicine({
        appointmentId,
        patientId: paymentCheck.appointment.patientId,
        doctorId,
        sessionId,
        roomId: sessionId,
        status: 'ACTIVE',
        doctorJoined: true,
        startTime: new Date(),
        paymentVerified: true
      });
      await session.save();
    } else if (session.status === 'SCHEDULED') {
      // Update existing session to active
      session.status = 'ACTIVE';
      session.doctorJoined = true;
      session.startTime = new Date();
      await session.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Telemedicine call initiated',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        sessionId: session.sessionId,
        roomId: session.roomId,
        startTime: session.startTime,
        status: session.status,
        patientJoined: session.patientJoined,
        doctorJoined: session.doctorJoined,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Initiate telemedicine call error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate telemedicine call',
      data: null
    });
  }
};

// End telemedicine call
const endTelemedicineCall = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const session = await Telemedicine.findOne({ appointmentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
        data: null
      });
    }

    // Calculate duration
    const duration = session.startTime
      ? Math.floor((new Date() - new Date(session.startTime)) / 1000)
      : 0;

    session.status = 'COMPLETED';
    session.endTime = new Date();
    session.duration = duration;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Telemedicine call ended',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        status: session.status,
        duration: session.duration,
        endTime: session.endTime
      }
    });
  } catch (error) {
    console.error('End telemedicine call error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end telemedicine call',
      data: null
    });
  }
};

// Update session participant status
const updateSessionParticipant = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { participantType, joined } = req.body;

    const session = await Telemedicine.findOne({ appointmentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
        data: null
      });
    }

    if (participantType === 'patient') {
      session.patientJoined = joined;
    } else if (participantType === 'doctor') {
      session.doctorJoined = joined;
    }

    // If both joined, set status to ACTIVE
    if (session.patientJoined && session.doctorJoined && session.status === 'SCHEDULED') {
      session.status = 'ACTIVE';
      if (!session.startTime) {
        session.startTime = new Date();
      }
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Session participant status updated',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        status: session.status,
        patientJoined: session.patientJoined,
        doctorJoined: session.doctorJoined
      }
    });
  } catch (error) {
    console.error('Update participant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update participant status',
      data: null
    });
  }
};

// Get session details
const getSessionDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const session = await Telemedicine.findOne({ appointmentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session details retrieved',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        sessionId: session.sessionId,
        roomId: session.roomId,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        patientJoined: session.patientJoined,
        doctorJoined: session.doctorJoined,
        duration: session.duration,
        notes: session.notes,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Get session details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session details',
      data: null
    });
  }
};

// Add notes to session
const addSessionNotes = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { notes } = req.body;

    const session = await Telemedicine.findOne({ appointmentId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
        data: null
      });
    }

    session.notes = notes;
    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Session notes added',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        notes: session.notes
      }
    });
  } catch (error) {
    console.error('Add session notes error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add session notes',
      data: null
    });
  }
};

// Get session by room ID (for patient joining)
const getSessionByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;

    const session = await Telemedicine.findOne({ roomId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Telemedicine session not found',
        data: null
      });
    }

    // Check if session is still active
    if (session.status !== 'ACTIVE' && session.status !== 'SCHEDULED') {
      return res.status(410).json({
        success: false,
        message: 'This telemedicine session is no longer available',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Session retrieved',
      data: {
        _id: session._id,
        appointmentId: session.appointmentId,
        sessionId: session.sessionId,
        roomId: session.roomId,
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        patientJoined: session.patientJoined,
        doctorJoined: session.doctorJoined,
        createdAt: session.createdAt
      }
    });
  } catch (error) {
    console.error('Get session by room ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve session',
      data: null
    });
  }
};

module.exports = {
  getOrCreateTelemedicineSession,
  initiateTelemedicineCall,
  endTelemedicineCall,
  updateSessionParticipant,
  getSessionDetails,
  addSessionNotes,
  getSessionByRoomId
};
