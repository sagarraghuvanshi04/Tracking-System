const fs = require('fs');
const path = require('path');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const { parseResume, scoreCandidate } = require('../utils/openrouter');

const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.pdf') {
    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return cleanText(data.text || '');
    } catch (e) {
      console.error('PDF parse error:', e.message);
      return '';
    }
  }

  if (ext === '.docx') {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return cleanText(result.value || '');
    } catch (e) {
      console.error('DOCX parse error:', e.message);
      return '';
    }
  }

  if (ext === '.doc') {
    try {
      // fallback: read as binary and extract readable ASCII text
      const buffer = fs.readFileSync(filePath);
      const text = buffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return cleanText(text);
    } catch (e) {
      console.error('DOC parse error:', e.message);
      return '';
    }
  }

  // .txt and others
  try {
    return cleanText(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return '';
  }
};

const cleanText = (text) => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]{3,}/g, '  ')   // collapse excessive spaces
    .replace(/\n{4,}/g, '\n\n\n') // collapse excessive blank lines
    .trim();
};

exports.createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create(req.body);
    res.status(201).json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadAndParseResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const resumeUrl = `/uploads/${req.file.filename}`;
    const resumeText = await extractTextFromFile(req.file.path);

    let parsedData = {};
    let aiParsed = false;
    let aiError = null;

    if (resumeText && resumeText.length > 30) {
      try {
        parsedData = await parseResume(resumeText);
        aiParsed = !!(parsedData.name || parsedData.email || parsedData.skills?.length);
      } catch (aiErr) {
        console.error('AI parsing failed:', aiErr.message);
        aiError = aiErr.message;
      }
    }

    // Duplicate detection by email or name similarity
    let isDuplicate = false;
    let duplicateOf = null;
    if (parsedData.email && !parsedData.email.includes('@noemail.local')) {
      const existing = await Candidate.findOne({ email: parsedData.email });
      if (existing) {
        isDuplicate = true;
        duplicateOf = existing._id;
      }
    }

    const candidateData = {
      ...parsedData,
      name: parsedData.name || req.file.originalname.replace(/\.[^/.]+$/, '') || 'Unknown Candidate',
      email: parsedData.email || `unknown_${Date.now()}@noemail.local`,
      resumeUrl,
      resumeText,
      aiParsed,
      isDuplicate,
      duplicateOf,
      source: 'upload',
    };

    const candidate = await Candidate.create(candidateData);

    res.status(201).json({ candidate, aiParsed, isDuplicate, aiError });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { search, skills, minExp, page = 1, limit = 10, includeDuplicates } = req.query;
    const query = {};
    if (!includeDuplicates) query.isDuplicate = false;
    if (search) query.$text = { $search: search };
    if (skills) {
      const skillArr = skills.split(',').map((s) => s.trim()).filter(Boolean);
      query.skills = { $in: skillArr.map((s) => new RegExp(s, 'i')) };
    }
    if (minExp !== undefined && minExp !== '') {
      query.totalExperienceYears = { $gte: Number(minExp) };
    }

    const total = await Candidate.countDocuments(query);
    const candidates = await Candidate.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ candidates, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Candidate deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reparseCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    if (!candidate.resumeText || candidate.resumeText.length < 30)
      return res.status(400).json({ message: 'No resume text available to reparse' });

    let parsedData = {};
    let aiParsed = false;
    let aiError = null;
    try {
      parsedData = await parseResume(candidate.resumeText);
      aiParsed = !!(parsedData.name || parsedData.email || parsedData.skills?.length);
    } catch (err) {
      console.error('Reparse failed:', err.message);
      aiError = err.message;
    }

    if (!aiParsed) return res.status(500).json({ message: aiError || 'AI parsing failed' });

    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      {
        ...parsedData,
        name: parsedData.name || candidate.name,
        email: parsedData.email || candidate.email,
        aiParsed: true,
      },
      { new: true }
    );
    res.json({ candidate: updated, aiParsed: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDuplicates = async (req, res) => {
  try {
    const duplicates = await Candidate.find({ isDuplicate: true })
      .populate('duplicateOf', 'name email createdAt')
      .sort({ createdAt: -1 });
    res.json(duplicates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSmartShortlist = async (req, res) => {
  try {
    const { jobId } = req.params;
    const Job = require('../models/Job');
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Get all applications for this job with AI scores
    const applications = await Application.find({ job: jobId, aiScore: { $gt: 0 } })
      .populate('candidate', 'name email skills totalExperienceYears summary')
      .sort({ aiScore: -1 })
      .limit(20);

    // Smart shortlist: top candidates with score >= 60 and not rejected
    const shortlist = applications
      .filter((a) => a.aiScore >= 60 && a.stage !== 'rejected')
      .slice(0, 10)
      .map((a) => ({
        applicationId: a._id,
        candidate: a.candidate,
        aiScore: a.aiScore,
        aiRecommendation: a.aiRecommendation,
        stage: a.stage,
        isShortlisted: a.isShortlisted,
        scoreBreakdown: a.aiScoreBreakdown,
      }));

    res.json({ job: { title: job.title, skills: job.skills }, shortlist, total: shortlist.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
