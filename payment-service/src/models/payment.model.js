const mongoose = require('mongoose');

const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'];

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    patientId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      default: 'LKR'
    },
    gateway: {
      type: String,
      required: true,
      trim: true,
      default: 'PAYHERE',
      index: true
    },
    transactionId: {
      type: String,
      trim: true,
      default: null,
      index: true,
      sparse: true
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'PENDING',
      index: true
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: null
    },
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payment', paymentSchema);
