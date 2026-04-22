const mongoose = require("mongoose");
const {
  getMyAppointments,
  getAppointmentStatus,
  getDoctorAppointments,
} = require("../services/appointmentTracking.service");
const {
  markSlotAsBooked,
  releaseBookedSlot,
} = require("../services/availabilityValidation.service");
const Appointment = require("../models/appointment.model");

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
const env = require("../config/env");
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

const getAppointmentPaymentEligibility = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        data: { eligible: false, reason: 'Invalid appointment ID' }
      });
    }

    const appointment = await Appointment.findById(appointmentId).lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        data: { eligible: false, reason: 'Appointment not found' }
      });
    }

    const status = String(appointment.status || '').toUpperCase();
    const paymentStatus = String(appointment.paymentStatus || '').toUpperCase();

    if (status === 'CONFIRMED' && paymentStatus === 'UNPAID') {
      return res.status(200).json({
        success: true,
        data: {
          eligible: true,
          appointmentId: appointment._id,
          amount: appointment.consultationFee,
          status,
          paymentStatus
        }
      });
    }

    if (status === 'PENDING_DOCTOR_APPROVAL') {
      return res.status(200).json({
        success: false,
        data: {
          eligible: false,
          reason: 'Please wait for the doctor to accept your appointment before proceeding with payment'
        }
      });
    }

    if (status === 'PENDING_PAYMENT') {
      return res.status(200).json({
        success: true,
        data: {
          eligible: true,
          appointmentId: appointment._id,
          amount: appointment.consultationFee,
          status,
          paymentStatus
        }
      });
    }

    if (paymentStatus === 'PAID') {
      return res.status(200).json({
        success: false,
        data: {
          eligible: false,
          reason: 'Payment has already been completed for this appointment'
        }
      });
    }

    if (status === 'CANCELLED' || status === 'COMPLETED') {
      return res.status(200).json({
        success: false,
        data: {
          eligible: false,
          reason: `Payment is not allowed for ${status.toLowerCase()} appointments`
        }
      });
    }

    return res.status(200).json({
      success: false,
      data: {
        eligible: false,
        reason: `Payment is not allowed for appointments with status ${status}`
      }
    });
  } catch (error) {
    console.error('Get appointment payment eligibility error:', error);
    return res.status(500).json({
      success: false,
      data: { eligible: false, reason: 'Unable to check payment eligibility' }
    });
  }
};

const addAppointmentPrescription = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { medicines, notes } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
        data: null,
      });
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one medicine is required",
        data: null,
      });
    }

    const normalizedMedicines = medicines.map((item) => ({
      name: String(item?.name || "").trim(),
      dosage: String(item?.dosage || "").trim(),
      frequency: String(item?.frequency || "").trim(),
      duration: String(item?.duration || "").trim(),
      instructions: item?.instructions ? String(item.instructions).trim() : null,
    }));

    const hasInvalidMedicine = normalizedMedicines.some(
      (item) => !item.name || !item.dosage || !item.frequency || !item.duration,
    );

    if (hasInvalidMedicine) {
      return res.status(400).json({
        success: false,
        message: "Each medicine must include name, dosage, frequency, and duration",
        data: null,
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        data: null,
      });
    }

    const authUserId = String(req.user?.id || "").trim();
    const appointmentDoctorId = String(appointment.doctorId || "").trim();

    if (req.user?.role !== "doctor" || !authUserId || authUserId !== appointmentDoctorId) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add a prescription to this appointment",
        data: null,
      });
    }

    const status = String(appointment.status || "").toUpperCase();
    if (!["CONFIRMED", "COMPLETED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Prescription can be added only for confirmed or completed appointments. Current status: ${status}`,
        data: null,
      });
    }

    if (!Array.isArray(appointment.prescriptions)) {
      appointment.prescriptions = [];
    }

    const prescription = {
      medicines: normalizedMedicines,
      notes: notes ? String(notes).trim() : null,
      createdAt: new Date(),
    };

    appointment.prescriptions.push(prescription);
    await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Prescription added successfully",
      data: {
        appointmentId: appointment._id,
        prescription: {
          medicines: prescription.medicines,
          notes: prescription.notes,
          prescribedAt: prescription.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Add appointment prescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add prescription",
      data: null,
      error: error.message,
    });
  }
};

const getAppointmentPrescription = async (req, res) => {
  try {
    const appointmentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
        data: null,
      });
    }

    const appointment = await Appointment.findById(appointmentId).lean();
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        data: null,
      });
    }

    const authUserId = String(req.user?.id || "").trim();
    const appointmentDoctorId = String(appointment.doctorId || "").trim();
    const appointmentPatientId = String(appointment.patientId || "").trim();

    const canRead =
      (req.user?.role === "doctor" && authUserId === appointmentDoctorId) ||
      (req.user?.role === "patient" && authUserId === appointmentPatientId);

    if (!canRead) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this prescription",
        data: null,
      });
    }

    if (!Array.isArray(appointment.prescriptions) || appointment.prescriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No prescriptions found for this appointment",
        data: null,
      });
    }

    const latestPrescription = appointment.prescriptions[appointment.prescriptions.length - 1];

    return res.status(200).json({
      success: true,
      message: "Prescription fetched successfully",
      data: {
        appointmentId: appointment._id,
        appointmentDate: appointment.appointmentDate,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        prescription: {
          medicines: latestPrescription.medicines || [],
          notes: latestPrescription.notes || null,
          prescribedAt: latestPrescription.createdAt || null,
        },
      },
    });
  } catch (error) {
    console.error("Get appointment prescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
      data: null,
      error: error.message,
    });
  }
};

const updateDoctorAppointmentStatus = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status, declineReason, doctorNote } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
        data: null,
      });
    }

    const validStatuses = ["ACCEPTED", "REJECTED"];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: `Status must be either ACCEPTED or REJECTED`,
        data: null,
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
        data: null,
      });
    }

    if (appointment.status !== "PENDING_DOCTOR_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Cannot update appointment with status ${appointment.status}. Only PENDING_DOCTOR_APPROVAL appointments can be accepted or rejected.`,
        data: null,
      });
    }

    const normalizedStatus = status.toUpperCase();
    let newAppointmentStatus = appointment.status;
    let notificationEventType = null;

    if (normalizedStatus === "ACCEPTED") {
      newAppointmentStatus = "PENDING_PAYMENT";
      appointment.status = newAppointmentStatus;
      appointment.paymentStatus = "UNPAID";

      await markSlotAsBooked(
        appointment.doctorId,
        appointment.appointmentDate,
        appointment.startTime
      );

      notificationEventType = "APPOINTMENT_ACCEPTED";
    } else if (normalizedStatus === "REJECTED") {
      newAppointmentStatus = "CANCELLED";
      appointment.status = newAppointmentStatus;
      appointment.paymentStatus = "CANCELLED";

      notificationEventType = "APPOINTMENT_REJECTED";
    }

    if (doctorNote) {
      appointment.doctorNote = doctorNote.trim();
    }

    if (declineReason) {
      appointment.declineReason = declineReason.trim();
    }

    await appointment.save();

    // Send notification via HTTP to notification-service
    try {
      const { fetchPatientDetails } = require("../services/appointmentTracking.service");
      const patientDetails = await fetchPatientDetails(
        appointment.patientId,
        req.headers.authorization
      );

      const notifBaseUrl = String(env.notificationServiceUrl || "").replace(/\/$/, "");
      if (notifBaseUrl && patientDetails) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(notifBaseUrl + "/notify/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: notificationEventType,
            patientEmail: patientDetails.email,
            patientPhone: patientDetails.phone,
            metadata: {
              appointmentId: String(appointment._id),
              doctorId: appointment.doctorId,
              specialty: appointment.specialty,
              appointmentDate: appointment.appointmentDate,
              startTime: appointment.startTime,
              declineReason: appointment.declineReason,
              doctorNote: appointment.doctorNote,
            },
          }),
          signal: controller.signal,
        }).catch((err) => {
          console.warn("[updateDoctorAppointmentStatus] Notification call failed:", err.message);
        });

        clearTimeout(timeout);
      }
    } catch (notifError) {
      console.error("[updateDoctorAppointmentStatus] Notification error:", notifError.message);
    }

    return res.status(200).json({
      success: true,
      message:
        normalizedStatus === "ACCEPTED"
          ? "Appointment accepted. Patient can now proceed with payment."
          : "Appointment rejected. Patient has been notified.",
      data: {
        appointmentId: appointment._id,
        status: appointment.status,
        paymentStatus: appointment.paymentStatus,
        doctorNote: appointment.doctorNote,
        declineReason: appointment.declineReason,
      },
    });
  } catch (error) {
    console.error("Update doctor appointment status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      data: null,
      error: error.message,
    });
  }
};

module.exports = {
  getPatientAppointments,
  getAppointmentStatusById,
  getAppointmentById,
  getDoctorAppointmentsById,
  updateDoctorAppointmentStatus,
  getAppointmentPaymentEligibility,
  addAppointmentPrescription,
  getAppointmentPrescription,
};

