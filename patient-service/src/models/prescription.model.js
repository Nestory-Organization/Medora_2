const mongoose = require("mongoose");

const PRESCRIPTION_STATUSES = ["active", "completed", "cancelled", "expired"];

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, "Medication dosage is required"],
      trim: true,
    },
    frequency: {
      type: String,
      required: [true, "Medication frequency is required"],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, "Medication duration is required"],
      trim: true,
    },
    instructions: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false },
);

const prescriptionSchema = new mongoose.Schema(
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
    doctorName: {
      type: String,
      trim: true,
      default: null,
    },
    doctorSpecialty: {
      type: String,
      trim: true,
      default: null,
    },
    medicalHistoryId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    medications: {
      type: [medicationSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: null,
    },
    prescriptionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: PRESCRIPTION_STATUSES,
        message: "Invalid prescription status: {VALUE}",
      },
      default: "active",
      index: true,
    },
  },
  { timestamps: true },
);

prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
