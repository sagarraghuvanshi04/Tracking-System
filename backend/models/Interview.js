const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 60 }, // minutes
    type: { type: String, enum: ['phone', 'video', 'onsite', 'technical'], default: 'video' },
    meetingLink: { type: String },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
    feedback: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
