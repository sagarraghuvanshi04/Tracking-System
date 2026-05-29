const { parseResume, scoreCandidate, extractKeywords, explainCandidate } = require('../utils/openrouter');

exports.parseResumeText = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Resume text is required' });
    const parsed = await parseResume(resumeText);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.scoreCandidateForJob = async (req, res) => {
  try {
    const { resumeText, jobDescription, jobSkills } = req.body;
    if (!resumeText || !jobDescription)
      return res.status(400).json({ message: 'resumeText and jobDescription are required' });
    const score = await scoreCandidate(resumeText, jobDescription, jobSkills || []);
    res.json(score);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.extractKeywordsFromText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const keywords = await extractKeywords(text);
    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.explainCandidateScore = async (req, res) => {
  try {
    const Application = require('../models/Application');
    const app = await Application.findById(req.params.applicationId)
      .populate('job')
      .populate('candidate');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    if (!app.candidate.resumeText)
      return res.status(400).json({ message: 'No resume text available' });

    const explanation = await explainCandidate(
      app.candidate.resumeText,
      app.job.description,
      app.job.skills,
      app.aiScore
    );
    res.json(explanation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
