const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    stage: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'technical', 'offer', 'hired', 'rejected'],
      default: 'applied',
    },
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    aiScoreBreakdown: {
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      overallFit: { type: Number, default: 0 },
    },
    aiRecommendation: { type: String },
    aiKeywords: [{ type: String }],
    notes: [
      {
        text: String,
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    stageHistory: [
      {
        stage: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: String,
      },
    ],
    isShortlisted: { type: Boolean, default: false },
    rejectionReason: { type: String },
    appliedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
