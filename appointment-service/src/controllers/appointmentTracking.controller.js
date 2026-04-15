const {
  getMyAppointments,
  getAppointmentStatus
} = require('../services/appointmentTracking.service');

const getPatientAppointments = async (req, res) => {
  const { patientId } = req.query;

  if (!patientId || !patientId.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Query parameter patientId is required',
      data: null
    });
  }

  try {
    const appointments = await getMyAppointments(patientId);

    return res.status(200).json({
      success: true,
      message: 'Patient appointments fetched successfully',
      data: appointments
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments',
      data: null
    });
  }
};

const getAppointmentStatusById = async (req, res) => {
  try {
    const appointment = await getAppointmentStatus(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        data: null
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment status fetched successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment status',
      data: null
    });
  }
};

module.exports = {
  getPatientAppointments,
  getAppointmentStatusById
};
