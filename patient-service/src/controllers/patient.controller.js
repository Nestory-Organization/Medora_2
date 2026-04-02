const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
  Patient,
  MedicalDocument,
  MedicalHistory,
  Prescription,
} = require("../models");
const { uploadDir } = require("../config/storage");

const CHRONIC_CONDITIONS = [
  "diabetes",
  "hypertension",
  "asthma",
  "heart_disease",
  "kidney_disease",
  "thyroid_disorder",
  "arthritis",
  "none",
  "other",
];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getPagination = (req, defaultLimit = 10) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(
    1,
    Math.min(100, Number(req.query.limit) || defaultLimit),
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const resolvePatientForRequest = async (req, source = "query") => {
  if (req.user.role === "patient") {
    return Patient.findOne({ userId: req.user.id });
  }

  const patientId =
    source === "params"
      ? req.params.patientId
      : req.query.patientId || req.body.patientId;

  if (!patientId || !isValidObjectId(patientId)) {
    return null;
  }

  return Patient.findById(patientId);
};

const registerPatient = async (req, res) => {
  try {
    const {
      userId,
      email,
      firstName,
      lastName,
      dateOfBirth,
      bloodType,
      allergies,
    } = req.body;

    if (!userId || !isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required",
      });
    }

    const existingPatient = await Patient.findOne({ userId });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: "Patient profile already exists for this userId",
      });
    }

    const patient = await Patient.create({
      userId,
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null,
      dateOfBirth: dateOfBirth || null,
      bloodType: bloodType || null,
      allergies: Array.isArray(allergies) ? allergies : [],
      medicalSummary: null,
      chronicConditions: [],
      currentMedications: [],
      medicalDocumentsCount: 0,
      lastVisitDate: null,
    });

    return res.status(201).json({
      success: true,
      message: "Patient profile created",
      data: { patient },
    });
  } catch (error) {
    console.error("registerPatient error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create patient profile",
    });
  }
};

const getPatientProfile = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const profile = {
      id: patient._id,
      userId: patient.userId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      dateOfBirth: patient.dateOfBirth,
      bloodType: patient.bloodType,
      allergies: patient.allergies,
      medicalSummary: patient.medicalSummary,
      chronicConditions: patient.chronicConditions,
      currentMedications: patient.currentMedications,
      medicalDocumentsCount: patient.medicalDocumentsCount,
      lastVisitDate: patient.lastVisitDate,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: { patient: profile },
    });
  } catch (error) {
    console.error("getPatientProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient profile",
    });
  }
};

const updatePatientProfile = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req, "body");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const payload = {};
    const allowedFields = [
      "medicalSummary",
      "chronicConditions",
      "currentMedications",
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        payload[field] = req.body[field];
      }
    });

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No updatable fields provided",
      });
    }

    if (payload.chronicConditions) {
      if (!Array.isArray(payload.chronicConditions)) {
        return res.status(400).json({
          success: false,
          message: "chronicConditions must be an array",
        });
      }

      const invalidCondition = payload.chronicConditions.find(
        (condition) => !CHRONIC_CONDITIONS.includes(condition),
      );

      if (invalidCondition) {
        return res.status(400).json({
          success: false,
          message: `Invalid chronic condition: ${invalidCondition}`,
        });
      }
    }

    if (
      payload.currentMedications &&
      !Array.isArray(payload.currentMedications)
    ) {
      return res.status(400).json({
        success: false,
        message: "currentMedications must be an array",
      });
    }

    Object.assign(patient, payload);
    await patient.save();

    return res.status(200).json({
      success: true,
      data: { patient },
    });
  } catch (error) {
    console.error("updatePatientProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update patient profile",
    });
  }
};

const uploadMedicalDocument = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req, "body");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const { documentType, category } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "documentType is required",
      });
    }

    const fileUrl = `/uploads/medical-documents/${req.file.filename}`;

    const document = await MedicalDocument.create({
      patientId: patient._id,
      documentType,
      title: category || req.file.originalname,
      category: category || null,
      fileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    });

    patient.medicalDocumentsCount = (patient.medicalDocumentsCount || 0) + 1;
    await patient.save();

    return res.status(201).json({
      success: true,
      data: {
        document: {
          id: document._id,
          fileName: document.originalName,
          documentType: document.documentType,
          uploadedAt: document.uploadedAt,
        },
        fileMetadata: req.fileMetadata,
      },
    });
  } catch (error) {
    console.error("uploadMedicalDocument error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload medical document",
    });
  }
};

const listMedicalDocuments = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const { page, limit, skip } = getPagination(req, 10);
    const query = { patientId: patient._id };

    if (req.query.documentType) {
      query.documentType = req.query.documentType;
    }

    const [documents, total] = await Promise.all([
      MedicalDocument.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicalDocument.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("listMedicalDocuments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to list documents",
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!isValidObjectId(docId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
      });
    }

    const document = await MedicalDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const patient = await resolvePatientForRequest(req);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (
      String(document.patientId) !== String(patient._id) &&
      req.user.role === "patient"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this document",
      });
    }

    const resolvedPath = path.resolve(
      uploadDir,
      document.fileName || path.basename(document.fileUrl),
    );

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on storage",
      });
    }

    console.info("Document accessed", {
      userId: req.user.id,
      role: req.user.role,
      documentId: String(document._id),
      patientId: String(document.patientId),
      at: new Date().toISOString(),
    });

    res.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${document.originalName || document.fileName}"`,
    );

    return res.sendFile(resolvedPath);
  } catch (error) {
    console.error("downloadDocument error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download document",
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!isValidObjectId(docId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id",
      });
    }

    const document = await MedicalDocument.findById(docId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const patient = await resolvePatientForRequest(req);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (
      String(document.patientId) !== String(patient._id) &&
      req.user.role === "patient"
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this document",
      });
    }

    const resolvedPath = path.resolve(
      uploadDir,
      document.fileName || path.basename(document.fileUrl),
    );
    if (fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }

    await MedicalDocument.deleteOne({ _id: document._id });

    patient.medicalDocumentsCount = Math.max(
      0,
      (patient.medicalDocumentsCount || 1) - 1,
    );
    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted",
    });
  } catch (error) {
    console.error("deleteDocument error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete document",
    });
  }
};

const getMedicalHistory = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const { page, limit, skip } = getPagination(req, 20);
    const query = { patientId: patient._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [entries, total] = await Promise.all([
      MedicalHistory.find(query)
        .sort({ appointmentDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MedicalHistory.countDocuments(query),
    ]);

    const mappedEntries = entries.map((entry) => ({
      ...entry,
      doctor: {
        id: entry.doctorId || null,
        name: entry.doctorName || "Unknown Doctor",
        specialty: entry.doctorSpecialty || null,
      },
    }));

    return res.status(200).json({
      success: true,
      data: {
        history: mappedEntries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("getMedicalHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch medical history",
    });
  }
};

const addMedicalHistory = async (req, res) => {
  try {
    if (!["doctor", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only doctors or admins can add medical history entries",
      });
    }

    const {
      patientId,
      title,
      description,
      symptoms,
      diagnosis,
      appointmentDate,
      visitNotes,
      status,
      doctorName,
      doctorSpecialty,
    } = req.body;

    if (!patientId || !isValidObjectId(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Valid patientId is required",
      });
    }

    if (!diagnosis || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: "diagnosis and appointmentDate are required",
      });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const entry = await MedicalHistory.create({
      patientId,
      doctorId: req.user.id,
      doctorName: doctorName || null,
      doctorSpecialty: doctorSpecialty || null,
      title: title || diagnosis,
      description: description || null,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      diagnosis,
      appointmentDate,
      notes: visitNotes || null,
      visitNotes: visitNotes || null,
      status: status || "open",
    });

    patient.lastVisitDate = appointmentDate;
    await patient.save();

    return res.status(201).json({
      success: true,
      data: { history: entry },
    });
  } catch (error) {
    console.error("addMedicalHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add medical history entry",
    });
  }
};

const getHistoryEntry = async (req, res) => {
  try {
    const { historyId } = req.params;

    if (!isValidObjectId(historyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid history entry id",
      });
    }

    const entry = await MedicalHistory.findById(historyId).lean();
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: "History entry not found",
      });
    }

    const patient =
      req.user.role === "patient"
        ? await Patient.findOne({ userId: req.user.id }).lean()
        : await Patient.findById(entry.patientId).lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const isPatientOwner =
      req.user.role === "patient" &&
      String(patient._id) === String(entry.patientId);
    const isEntryDoctor =
      req.user.role === "doctor" &&
      String(req.user.id) === String(entry.doctorId);
    const isAdmin = req.user.role === "admin";

    if (!isPatientOwner && !isEntryDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this history entry",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        history: {
          ...entry,
          doctor: {
            id: entry.doctorId || null,
            name: entry.doctorName || "Unknown Doctor",
            specialty: entry.doctorSpecialty || null,
          },
        },
      },
    });
  } catch (error) {
    console.error("getHistoryEntry error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch history entry",
    });
  }
};

const getPrescriptions = async (req, res) => {
  try {
    const patient = await resolvePatientForRequest(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const { page, limit, skip } = getPagination(req, 10);
    const query = { patientId: patient._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .sort({ prescriptionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prescription.countDocuments(query),
    ]);

    const mappedPrescriptions = prescriptions.map((item) => ({
      ...item,
      doctor: {
        id: item.doctorId || null,
        name: item.doctorName || "Unknown Doctor",
        specialty: item.doctorSpecialty || null,
      },
    }));

    return res.status(200).json({
      success: true,
      data: {
        prescriptions: mappedPrescriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("getPrescriptions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescriptions",
    });
  }
};

const getPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    if (!isValidObjectId(prescriptionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription id",
      });
    }

    const prescription = await Prescription.findById(prescriptionId).lean();
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const patient =
      req.user.role === "patient"
        ? await Patient.findOne({ userId: req.user.id }).lean()
        : await Patient.findById(prescription.patientId).lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const isPatientOwner =
      req.user.role === "patient" &&
      String(patient._id) === String(prescription.patientId);
    const isPrescribingDoctor =
      req.user.role === "doctor" &&
      String(req.user.id) === String(prescription.doctorId);
    const isAdmin = req.user.role === "admin";

    if (!isPatientOwner && !isPrescribingDoctor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to access this prescription",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        prescription: {
          ...prescription,
          doctor: {
            id: prescription.doctorId || null,
            name: prescription.doctorName || "Unknown Doctor",
            specialty: prescription.doctorSpecialty || null,
          },
        },
      },
    });
  } catch (error) {
    console.error("getPrescription error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch prescription",
    });
  }
};

module.exports = {
  registerPatient,
  getPatientProfile,
  updatePatientProfile,
  uploadMedicalDocument,
  listMedicalDocuments,
  downloadDocument,
  deleteDocument,
  getMedicalHistory,
  addMedicalHistory,
  getHistoryEntry,
  getPrescriptions,
  getPrescription,
};
