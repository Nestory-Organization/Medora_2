const mongoose = require("mongoose");

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

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
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
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
  },
  { timestamps: true },
);

patientSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Patient", patientSchema);
