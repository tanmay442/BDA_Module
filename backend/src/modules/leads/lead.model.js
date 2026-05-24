const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    currentStage: {
      type: String,
      enum: [
        'new',
        'contacted',
        'requirement_gathered',
        'quotation_sent',
        'negotiation',
        'won',
        'lost',
      ],
      default: 'new',
    },
    expectedDealValue: {
      type: Number,
      default: 0,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ currentStage: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ companyName: 1 });

module.exports = mongoose.model('Lead', leadSchema);
