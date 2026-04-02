const mongoose = require("mongoose");

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
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

const emergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, "Emergency contact name is required"],
    },
    phone: {
      type: String,
      trim: true,
      required: [true, "Emergency contact phone is required"],
      match: [
        /^\+?[0-9\s()-]{7,20}$/,
        "Please provide a valid emergency contact phone number",
      ],
    },
    relationship: {
      type: String,
      trim: true,
      required: [true, "Emergency contact relationship is required"],
    },
  },
  { _id: false },
);

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "userId is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    firstName: {
      type: String,
      default: null,
      trim: true,
    },
    lastName: {
      type: String,
      default: null,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    bloodType: {
      type: String,
      enum: {
        values: BLOOD_TYPES,
        message: "Invalid blood type: {VALUE}",
      },
      default: null,
    },
    allergies: {
      type: [String],
      default: [],
      validate: {
        validator: (values) =>
          Array.isArray(values) &&
          values.every(
            (item) => typeof item === "string" && item.trim().length > 0,
          ),
        message: "Allergies must be a list of non-empty strings",
      },
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: null,
    },
    medicalSummary: {
      type: String,
      trim: true,
      default: null,
    },
    chronicConditions: {
      type: [String],
      enum: {
        values: CHRONIC_CONDITIONS,
        message: "Invalid chronic condition: {VALUE}",
      },
      default: [],
    },
    currentMedications: {
      type: [String],
      default: [],
    },
    medicalDocumentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastVisitDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Patient", patientSchema);
