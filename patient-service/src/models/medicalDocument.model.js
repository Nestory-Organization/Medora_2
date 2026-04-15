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
    category: {
      type: String,
      trim: true,
      default: null,
    },
    fileUrl: {
      type: String,
      required: [true, "Document fileUrl is required"],
      trim: true,
    },
    fileName: {
      type: String,
      required: [true, "Stored file name is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, "File mimeType is required"],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      min: 0,
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
