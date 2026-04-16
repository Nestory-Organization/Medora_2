const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS'],
      required: true,
      index: true
    },
    eventType: {
      type: String,
      default: 'MANUAL',
      index: true
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      trim: true,
      default: null
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['SENT', 'FAILED', 'SKIPPED'],
      required: true,
      index: true
    },
    provider: {
      type: String,
      default: 'mock'
    },
    providerMessageId: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
