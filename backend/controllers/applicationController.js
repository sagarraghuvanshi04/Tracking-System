const Application = require('../models/Application');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { scoreCandidate } = require('../utils/openrouter');
const { sendApplicationConfirmation, sendStatusUpdate } = require('../utils/email');
const { createNotification } = require('./notificationController');

exports.createApplication = async (req, res) => {
  try {
    const { jobId, candidateId } = req.body;

    const existing = await Application.findOne({ job: jobId, candidate: candidateId });
    if (existing) return res.status(400).json({ message: 'Application already exists' });

    const [job, candidate] = await Promise.all([
      Job.findById(jobId),
      Candidate.findById(candidateId),
    ]);
    if (!job || !candidate) return res.status(404).json({ message: 'Job or Candidate not found' });

    const application = await Application.create({
      job: jobId,
      candidate: candidateId,
      stageHistory: [{ stage: 'applied', changedBy: req.user._id }],
    });

    // Increment applicants count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicantsCount: 1 } });

    // AI scoring in background
    if (candidate.resumeText) {
      scoreCandidate(candidate.resumeText, job.description, job.skills)
        .then(async (score) => {
          await Application.findByIdAndUpdate(application._id, {
            aiScore: score.overallScore,
            aiScoreBreakdown: {
              skillsMatch: score.skillsMatch,
              experienceMatch: score.experienceMatch,
              educationMatch: score.educationMatch,
              overallFit: score.overallFit,
            },
            aiRecommendation: score.recommendation,
            aiKeywords: score.keywords || [],
          });
        })
        .catch((err) => console.error('AI scoring error:', err.message));
    }

    // Send confirmation email
    if (candidate.email) {
      sendApplicationConfirmation(candidate.email, candidate.name, job.title);
    }

    // Notify all admins and recruiters
    const User = require('../models/User');
    const staff = await User.find({ role: { $in: ['admin', 'recruiter'] } }).select('_id');
    await Promise.all(staff.map((u) =>
      createNotification(u._id, 'New Application', `${candidate.name} applied for ${job.title}`, 'application', '/app/applications')
    ));

    const populated = await Application.findById(application._id)
      .populate('job', 'title department')
      .populate('candidate', 'name email skills');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const { jobId, stage, isShortlisted, page = 1, limit = 10 } = req.query;
    const query = {};

    if (jobId) query.job = jobId;
    if (stage) query.stage = stage;
    if (isShortlisted !== undefined) query.isShortlisted = isShortlisted === 'true';

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('job', 'title department location')
      .populate('candidate', 'name email phone skills totalExperienceYears resumeUrl')
      .populate('reviewedBy', 'name')
      .sort({ aiScore: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ applications, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('candidate')
      .populate('notes.addedBy', 'name')
      .populate('stageHistory.changedBy', 'name');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateStage = async (req, res) => {
  try {
    const { stage, note } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.stage = stage;
    application.stageHistory.push({ stage, changedBy: req.user._id, note });
    application.reviewedBy = req.user._id;
    await application.save();

    // Send status update email to candidate
    const populated = await Application.findById(req.params.id)
      .populate('candidate', 'name email')
      .populate('job', 'title');
    if (populated.candidate?.email && !populated.candidate.email.includes('@noemail.local')) {
      sendStatusUpdate(populated.candidate.email, populated.candidate.name, populated.job?.title, stage);
    }

    // Notify the user who made the change
    await createNotification(
      req.user._id,
      'Stage Updated',
      `${populated.candidate?.name} moved to "${stage}" for ${populated.job?.title}`,
      'stage',
      '/app/pipeline'
    );

    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addNote = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $push: { notes: { text: req.body.text, addedBy: req.user._id } } },
      { new: true }
    ).populate('notes.addedBy', 'name');
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleShortlist = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.isShortlisted = !application.isShortlisted;
    await application.save();
    res.json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rescoreApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('candidate');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (!application.candidate.resumeText)
      return res.status(400).json({ message: 'No resume text available for scoring' });

    const score = await scoreCandidate(
      application.candidate.resumeText,
      application.job.description,
      application.job.skills
    );

    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      {
        aiScore: score.overallScore,
        aiScoreBreakdown: {
          skillsMatch: score.skillsMatch,
          experienceMatch: score.experienceMatch,
          educationMatch: score.educationMatch,
          overallFit: score.overallFit,
        },
        aiRecommendation: score.recommendation,
        aiKeywords: score.keywords || [],
      },
      { new: true }
    );

    res.json({ application: updated, scoreDetails: score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
