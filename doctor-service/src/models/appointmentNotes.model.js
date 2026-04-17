const mongoose = require('mongoose');

const appointmentNotesSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: 'Appointment Notes'
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    diagnosis: {
      type: String,
      trim: true,
      default: null
    },
    treatment: {
      type: String,
      trim: true,
      default: null
    },
    followUp: {
      type: String,
      trim: true,
      default: null
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AppointmentNotes', appointmentNotesSchema);
