const axios = require('axios');

const APPOINTMENT_SERVICE_URL = (process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:4004').replace(/\/+$/, '');

const buildAppointmentUrl = (path) => {
  // Support both APPOINTMENT_SERVICE_URL values with and without trailing /api
  if (APPOINTMENT_SERVICE_URL.endsWith('/api')) {
    return `${APPOINTMENT_SERVICE_URL}${path}`;
  }
  return `${APPOINTMENT_SERVICE_URL}${path}`;
};

// Get pending reschedule requests for a doctor
const getPendingRescheduleRequests = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Call appointment service to get reschedule requests
    const response = await axios.get(
      buildAppointmentUrl(`/appointments/doctor/${doctorId}/reschedule-requests`)
    );

    return res.status(200).json({
      success: true,
      message: 'Reschedule requests fetched successfully',
      data: response.data.data,
      count: response.data.count
    });
  } catch (error) {
    console.error('Get reschedule requests error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reschedule requests',
      error: error.message,
      data: null
    });
  }
};

// Doctor approves a reschedule request
const approveRescheduleRequest = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    // Call appointment service to approve reschedule
    const response = await axios.put(
      buildAppointmentUrl(`/appointments/${appointmentId}/reschedule-request/approve`)
    );

    return res.status(200).json({
      success: true,
      message: 'Reschedule request approved successfully',
      data: response.data.data
    });
  } catch (error) {
    console.error('Approve reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve reschedule',
      error: error.message,
      data: null
    });
  }
};

// Doctor rejects a reschedule request
const rejectRescheduleRequest = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { rejectionReason } = req.body;

    // Call appointment service to reject reschedule
    const response = await axios.put(
      buildAppointmentUrl(`/appointments/${appointmentId}/reschedule-request/reject`),
      { rejectionReason }
    );

    return res.status(200).json({
      success: true,
      message: 'Reschedule request rejected successfully',
      data: response.data.data
    });
  } catch (error) {
    console.error('Reject reschedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject reschedule',
      error: error.message,
      data: null
    });
  }
};

module.exports = {
  getPendingRescheduleRequests,
  approveRescheduleRequest,
  rejectRescheduleRequest
};
