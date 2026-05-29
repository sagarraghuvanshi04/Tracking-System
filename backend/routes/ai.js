const router = require('express').Router();
const { parseResumeText, scoreCandidateForJob, extractKeywordsFromText, explainCandidateScore } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/parse-resume', protect, parseResumeText);
router.post('/score-candidate', protect, scoreCandidateForJob);
router.post('/extract-keywords', protect, extractKeywordsFromText);
router.get('/explain/:applicationId', protect, explainCandidateScore);

module.exports = router;
