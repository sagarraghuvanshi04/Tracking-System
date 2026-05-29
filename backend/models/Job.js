const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    location: { type: String, required: true },
    type: { type: String, enum: ['full-time', 'part-time', 'contract', 'remote', 'hybrid'], default: 'full-time' },
    experience: { type: String, required: true },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
    },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    skills: [{ type: String }],
    status: { type: String, enum: ['draft', 'active', 'paused', 'closed'], default: 'active' },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hiringManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deadline: { type: Date },
    applicantsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
