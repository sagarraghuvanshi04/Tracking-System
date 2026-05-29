const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true },
    phone: { type: String },
    location: { type: String },
    resumeUrl: { type: String },
    resumeText: { type: String },
    linkedIn: { type: String },
    portfolio: { type: String },
    skills: [{ type: String }],
    experience: [
      {
        company: String,
        title: String,
        duration: String,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        year: String,
      },
    ],
    summary: { type: String },
    totalExperienceYears: { type: Number, default: 0 },
    aiParsed: { type: Boolean, default: false },
    source: { type: String, enum: ['manual', 'upload', 'linkedin', 'referral'], default: 'upload' },
    tags: [{ type: String }],
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
  },
  { timestamps: true }
);

candidateSchema.index({ email: 1 });
candidateSchema.index({ name: 'text', skills: 'text', summary: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);
