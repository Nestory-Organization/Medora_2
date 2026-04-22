const mongoose = require('mongoose');

const APPOINTMENT_STATUSES = [
  'PENDING_DOCTOR_APPROVAL',
  'PENDING_PAYMENT',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED'
];

const PAYMENT_STATUSES = ['UNPAID', 'PAID', 'FAILED', 'REFUNDED'];

const RESCHEDULE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      trim: true,
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
    doctorId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      index: true
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
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUSES,
      default: 'PENDING_DOCTOR_APPROVAL',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'UNPAID',
      index: true
    },
    rescheduleRequest: {
      status: {
        type: String,
        enum: RESCHEDULE_REQUEST_STATUSES,
        default: null
      },
      requestedDate: {
        type: Date,
        default: null
      },
      requestedStartTime: {
        type: String,
        default: null
      },
      requestedEndTime: {
        type: String,
        default: null
      },
      reason: {
        type: String,
        default: null
      },
      createdAt: {
        type: Date,
        default: null
      },
      approvedAt: {
        type: Date,
        default: null
      },
      rejectionReason: {
        type: String,
        default: null
      }
    },
    doctorNote: {
      type: String,
      default: null
    },
    declineReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

appointmentSchema.index(
  {
    doctorId: 1,
    appointmentDate: 1,
    startTime: 1
  },
  { unique: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);