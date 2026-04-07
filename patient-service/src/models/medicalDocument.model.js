const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "lab_report",
  "xray",
  "scan",
  "prescription",
  "discharge_summary",
  "insurance",
  "other",
];

const medicalDocumentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "patientId is required"],
      index: true,
    },
    documentType: {
      type: String,
      required: [true, "Document type is required"],
      enum: {
        values: DOCUMENT_TYPES,
        message: "Invalid document type: {VALUE}",
      },
      index: true,
    },
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "Document fileUrl is required"],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
);

medicalDocumentSchema.index({ patientId: 1, documentType: 1, uploadedAt: -1 });

module.exports = mongoose.model("MedicalDocument", medicalDocumentSchema);
