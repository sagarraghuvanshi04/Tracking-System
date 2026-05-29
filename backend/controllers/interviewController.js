const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const { sendInterviewInvite } = require('../utils/email');

exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId, scheduledAt, type, duration, interviewers, meetingLink, notes } = req.body;

    const application = await Application.findById(applicationId)
      .populate('candidate')
      .populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (!application.candidate) return res.status(400).json({ message: 'Candidate not found for this application' });

    // job may be null if populate fails (e.g. job was deleted)
    // fall back to raw ObjectId stored on the application document
    let jobId = application.job?._id || application.job;
    let jobTitle = application.job?.title || 'the position';

    // If still null, check the raw document without populate
    if (!jobId) {
      const rawApp = await Application.findById(applicationId).lean();
      jobId = rawApp?.job || null;
    }

    if (!jobId) return res.status(400).json({ message: 'This application has no associated job. Please create a new application linked to an active job.' });

    const interview = await Interview.create({
      application: applicationId,
      job: jobId,
      candidate: application.candidate._id,
      scheduledAt,
      type,
      duration: duration || 60,
      interviewers: interviewers || [],
      meetingLink: meetingLink || '',
      notes: notes || '',
    });

    // Update application stage to interview
    await Application.findByIdAndUpdate(applicationId, {
      stage: 'interview',
      $push: { stageHistory: { stage: 'interview', changedBy: req.user._id, note: 'Interview scheduled' } },
    });

    // Send email invite (non-blocking)
    const candidate = application.candidate;
    if (candidate.email && !candidate.email.includes('@noemail.local')) {
      sendInterviewInvite(candidate.email, candidate.name, jobTitle, scheduledAt, meetingLink);
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .populate('interviewers', 'name email');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInterviews = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const query = {};

    if (status) query.status = status;
    if (upcoming === 'true') query.scheduledAt = { $gte: new Date() };

    const interviews = await Interview.find(query)
      .populate('candidate', 'name email')
      .populate('job', 'title department')
      .populate('interviewers', 'name email')
      .sort({ scheduledAt: 1 });

    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .populate('interviewers', 'name email');
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json(interview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteInterview = async (req, res) => {
  try {
    await Interview.findByIdAndDelete(req.params.id);
    res.json({ message: 'Interview deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
