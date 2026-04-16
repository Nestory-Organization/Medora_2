const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      default: null,
      trim: true
    },
    doctorId: {
      type: String,
      default: null,
      trim: true
    },
    appointmentId: {
      type: String,
      default: null,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
