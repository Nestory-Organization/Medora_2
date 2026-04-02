const mongoose = require("mongoose");

const HISTORY_STATUSES = [
  "open",
  "in_progress",
  "resolved",
  "follow_up",
  "archived",
];

const treatmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Treatment name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      trim: true,
      default: null,
    },
    frequency: {
      type: String,
      trim: true,
      default: null,
    },
    duration: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false },
);

const medicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "patientId is required"],
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    appointmentDate: {
      type: Date,
      required: [true, "appointmentDate is required"],
      index: true,
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    treatments: {
      type: [treatmentSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: HISTORY_STATUSES,
        message: "Invalid medical history status: {VALUE}",
      },
      default: "open",
      index: true,
    },
  },
  { timestamps: true },
);

medicalHistorySchema.index({ patientId: 1, appointmentDate: -1 });
medicalHistorySchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model("MedicalHistory", medicalHistorySchema);
