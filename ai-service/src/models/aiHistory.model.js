const mongoose = require("mongoose");

const aiHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["analysis", "recommendation", "insight"],
      required: true,
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    resultData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Add index for faster history retrieval
aiHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("AiHistory", aiHistorySchema);
