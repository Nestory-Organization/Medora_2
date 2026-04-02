const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    specialization: {
      type: String,
      required: true,
      trim: true
    },
    qualification: {
      type: String,
      trim: true,
      default: null
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0
    },
    bio: {
      type: String,
      trim: true,
      default: null
    },
    clinicAddress: {
      type: String,
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
