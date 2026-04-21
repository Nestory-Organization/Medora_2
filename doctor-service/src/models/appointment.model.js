const mongoose = require('mongoose');

const patientReportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      required: true
    },
    fileUrl: {
      type: String,
      trim: true,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true,
      default: null
    }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    medicines: {
      type: [medicineSchema],
      default: []
    },
    notes: {
      type: String,
      trim: true,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    patientName: {
      type: String,
      default: 'Patient'
    },
    patientPhone: {
      type: String,
      default: null
    },
    patientEmail: {
      type: String,
      default: null
    },
    specialty: {
      type: String,
      default: 'General'
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true
    },
    startTime: {
      type: String,
      required: true,
      trim: true
    },
    endTime: {
      type: String,
      required: true,
      trim: true
    },
    reason: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'pending',
      index: true
    },
    patientReports: {
      type: [patientReportSchema],
      default: []
    },
    prescriptions: {
      type: [prescriptionSchema],
      default: []
    },
    telemedicine: {
      meetingLink: {
        type: String,
        trim: true,
        default: null
      },
      sessionId: {
        type: String,
        trim: true,
        default: null
      },
      requestedAt: {
        type: Date,
        default: null
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
