const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalJobs,
      activeJobs,
      totalCandidates,
      totalApplications,
      shortlisted,
      hired,
      upcomingInterviews,
      stageDistribution,
      recentApplications,
      topJobs,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Candidate.countDocuments({ isDuplicate: false }),
      Application.countDocuments(),
      Application.countDocuments({ isShortlisted: true }),
      Application.countDocuments({ stage: 'hired' }),
      Interview.countDocuments({ scheduledAt: { $gte: new Date() }, status: 'scheduled' }),
      Application.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      Application.find()
        .populate('candidate', 'name email')
        .populate('job', 'title department')
        .sort({ createdAt: -1 })
        .limit(5),
      Job.find({ status: 'active' }).sort({ applicantsCount: -1 }).limit(5).select('title department applicantsCount'),
    ]);

    // Monthly applications trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Application.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Avg AI score across all scored applications
    const avgScoreResult = await Application.aggregate([
      { $match: { aiScore: { $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: '$aiScore' }, totalScored: { $sum: 1 } } },
    ]);
    const avgAiScore = avgScoreResult[0] ? Math.round(avgScoreResult[0].avgScore) : 0;
    const totalScored = avgScoreResult[0]?.totalScored || 0;
    const conversionRate = totalApplications > 0 ? Math.round((hired / totalApplications) * 100) : 0;

    res.json({
      stats: { totalJobs, activeJobs, totalCandidates, totalApplications, shortlisted, hired, upcomingInterviews, avgAiScore, totalScored, conversionRate },
      stageDistribution,
      recentApplications,
      topJobs,
      monthlyTrend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
