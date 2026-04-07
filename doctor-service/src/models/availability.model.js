const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema(
  {
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
    isBooked: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    slots: {
      type: [slotSchema],
      default: []
    }
  },
  { timestamps: true }
);

availabilitySchema.index({ doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Availability', availabilitySchema);
