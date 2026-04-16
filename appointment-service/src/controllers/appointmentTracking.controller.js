const {
  getMyAppointments,
  getAppointmentStatus
} = require('../services/appointmentTracking.service');

const getPatientAppointments = async (req, res) => {
  try {
    let { patientId } = req.query;

    // If patientId is not in query, try to get it from authenticated user (if middleware is present)
    // JWT token stores ID as either 'id', '_id', 'userId', or 'sub'
    if (!patientId && req.user) {
      console.log('[Appointments] Auth user:', req.user);
      patientId = req.user.id || req.user._id || req.user.userId || req.user.sub;
    }

    if (!patientId || (typeof patientId === 'string' && !patientId.trim())) {
      console.warn('[Appointments] patientId not found in query or auth user:', {
        queryPatientId: req.query.patientId,
        authUser: req.user,
        derivedPatientId: patientId
      });
      
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. Please ensure you are authenticated.',
        data: null
      });
    }

    console.log(`[Appointments] Fetching appointments for patient: ${patientId}`);
    
    const appointments = await getMyAppointments(patientId);

    return res.status(200).json({
      success: true,
      message: 'Patient appointments fetched successfully',
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('[Appointments] Get patient appointments error:', error);
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
