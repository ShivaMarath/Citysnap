const mongoose = require('mongoose');

const StatusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'],
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['pothole', 'garbage', 'streetlight', 'flooding', 'infrastructure', 'other'],
      required: true,
    },

    mlCategory: { type: String, default: 'other' },
    mlConfidence: { type: Number, default: 0 },
    mlRawClass: { type: String, default: '' },

    images: [{ type: String }],

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, default: '' },
      ward: { type: String, default: '' },
      city: { type: String, default: '' },
    },

    status: {
      type: String,
      enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'rejected'],
      default: 'pending',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },

    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    upvotes: { type: Number, default: 1 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    witnesses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    statusHistory: { type: [StatusHistorySchema], default: [] },

    authorityNote: { type: String, default: '' },
    resolvedAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    escalationEmailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReportSchema.index({ location: '2dsphere' });

function computePriority(upvotes) {
  if (upvotes >= 20) return 'critical';
  if (upvotes >= 10) return 'high';
  if (upvotes >= 5) return 'medium';
  return 'low';
}

ReportSchema.pre('save', function (next) {
  if (typeof this.upvotes === 'number') {
    this.priority = computePriority(this.upvotes);
  }
  next();
});

module.exports = mongoose.model('Report', ReportSchema);

