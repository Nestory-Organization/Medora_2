const {
  getMyAppointments,
  getAppointmentStatus,
  getDoctorAppointments,
} = require("../services/appointmentTracking.service");

const getPatientAppointments = async (req, res) => {
  try {
    console.log("[Get Appointments] ========== START ==========");
    console.log("[Get Appointments] req.user:", req.user);
    console.log("[Get Appointments] req.query:", req.query);
    console.log(
      "[Get Appointments] req.headers.authorization present:",
      !!req.headers.authorization,
    );

    let { patientId } = req.query;

    // First priority: Get from query parameter (for direct API calls)
    if (patientId) {
      console.log("[Get Appointments] Using patientId from query:", patientId);
    }
    // Second priority: Get from authenticated user (JWT from API Gateway)
    else if (req.user && req.user.id) {
      patientId = req.user.id;
      console.log(
        "[Get Appointments] Using patientId from req.user.id:",
        patientId,
      );
    }
    // Fallback: Try other possible user ID fields
    else if (req.user) {
      patientId = req.user._id || req.user.userId || req.user.sub;
      console.log(
        "[Get Appointments] Using patientId from fallback user field:",
        patientId,
      );
    }

    if (!patientId || (typeof patientId === "string" && !patientId.trim())) {
      console.error("[Get Appointments] PatientId is missing/empty:", {
        patientId,
      });
      return res.status(400).json({
        success: false,
        message:
          "Patient ID is required. Please ensure you are authenticated or pass patientId as query parameter.",
        data: null,
      });
    }

    console.log(
      `[Get Appointments] Querying appointments for patientId: ${patientId}`,
    );

    const appointments = await getMyAppointments(patientId);

    console.log(`[Get Appointments] Found ${appointments.length} appointments`);
    console.log("[Get Appointments] ========== END ==========");

    return res.status(200).json({
      success: true,
      message: "Patient appointments fetched successfully",
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("[Get Appointments] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient appointments",
      data: null,
      error: error.message,
    });
  }
};

const getAppointmentStatusById = async (req, res) => {
  try {
    const appointment = await getAppointmentStatus(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Appointment status fetched successfully",
      data: appointment,
    });
  } catch (error) {
    console.error("Get appointment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment status",
      data: null,
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const Appointment = require("../models/appointment.model");
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        data: null,
      });
    }

    // Verify the user is either the patient or doctor of this appointment (security check)
    // Handle both string and ObjectId formats
    const userId = req.user.id?.toString
      ? req.user.id.toString()
      : String(req.user.id || "");
    const appointmentDoctor = appointment.doctorId?.toString
      ? appointment.doctorId.toString()
      : String(appointment.doctorId || "");
    const appointmentPatient = appointment.patientId?.toString
      ? appointment.patientId.toString()
      : String(appointment.patientId || "");

    const isPatient =
      userId && appointmentPatient && userId === appointmentPatient;
    const isDoctor =
      userId && appointmentDoctor && userId === appointmentDoctor;

    if (!isPatient && !isDoctor) {
      console.error("[Permission Check Failed]", {
        userId,
        appointmentDoctor,
        appointmentPatient,
        isPatient,
        isDoctor,
        userIdLength: userId?.length,
        doctorIdLength: appointmentDoctor?.length,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this appointment",
        data: null,
      });
    }

    // Fetch and enrich with doctor name
    const {
      fetchDoctorDetails,
    } = require("../services/appointmentTracking.service");
    const doctorName = await fetchDoctorDetails(appointment.doctorId);

    const enrichedAppointment = {
      ...appointment.toObject(),
      doctorName:
        doctorName ||
        `Doctor ${String(appointment.doctorId || "").substring(0, 8)}`,
    };

    return res.status(200).json({
      success: true,
      message: "Appointment fetched successfully",
      data: enrichedAppointment,
    });
  } catch (error) {
    console.error("Get appointment by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      data: null,
    });
  }
};

const getDoctorAppointmentsById = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "Doctor ID is required",
        data: null,
      });
    }

    const appointments = await getDoctorAppointments(
      doctorId,
      req.headers.authorization,
    );

    return res.status(200).json({
      success: true,
      message: "Doctor appointments fetched successfully",
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Get doctor appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor appointments",
      data: null,
    });
  }
};

module.exports = {
  getPatientAppointments,
  getAppointmentStatusById,
  getAppointmentById,
  getDoctorAppointmentsById,
};
