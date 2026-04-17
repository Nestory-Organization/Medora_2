const mongoose = require('mongoose');

const telemedicineSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      index: true
    },
    doctorId: {
      type: String,
      required: true,
      index: true
    },
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    roomId: {
      type: String,
      required: true,
      unique: true
    },
    startTime: {
      type: Date,
      default: null
    },
    endTime: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'MISSED'],
      default: 'SCHEDULED',
      index: true
    },
    patientJoined: {
      type: Boolean,
      default: false
    },
    doctorJoined: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number,
      default: 0 // in seconds
    },
    recordingUrl: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null
    },
    paymentVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Telemedicine', telemedicineSchema);
