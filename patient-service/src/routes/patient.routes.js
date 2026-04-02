const express = require("express");
const {
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
} = require("../controllers/patient.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { handleFileUpload } = require("../middleware/fileUpload.middleware");

const router = express.Router();

router.post("/register", registerPatient);

router.get(
  "/profile",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getPatientProfile,
);
router.put(
  "/profile",
  authenticate,
  authorize("patient", "doctor", "admin"),
  updatePatientProfile,
);

router.post(
  "/documents/upload",
  authenticate,
  authorize("patient", "doctor", "admin"),
  handleFileUpload,
  uploadMedicalDocument,
);
router.get(
  "/documents",
  authenticate,
  authorize("patient", "doctor", "admin"),
  listMedicalDocuments,
);
router.get(
  "/documents/:docId",
  authenticate,
  authorize("patient", "doctor", "admin"),
  downloadDocument,
);
router.delete(
  "/documents/:docId",
  authenticate,
  authorize("patient", "doctor", "admin"),
  deleteDocument,
);

router.get(
  "/history",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getMedicalHistory,
);
router.post(
  "/history",
  authenticate,
  authorize("doctor", "admin"),
  addMedicalHistory,
);
router.get(
  "/history/:historyId",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getHistoryEntry,
);

router.get(
  "/prescriptions",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getPrescriptions,
);
router.get(
  "/prescriptions/:prescriptionId",
  authenticate,
  authorize("patient", "doctor", "admin"),
  getPrescription,
);

module.exports = router;
