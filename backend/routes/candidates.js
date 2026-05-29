const router = require('express').Router();
const {
  createCandidate,
  uploadAndParseResume,
  getCandidates,
  getCandidate,
  updateCandidate,
  deleteCandidate,
  getDuplicates,
  getSmartShortlist,
  reparseCandidate,
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Specific routes BEFORE /:id to avoid param conflicts
router.get('/duplicates/list', protect, getDuplicates);
router.get('/shortlist/:jobId', protect, getSmartShortlist);
router.post('/upload-resume', protect, upload.single('resume'), uploadAndParseResume);

router.get('/', protect, getCandidates);
router.post('/', protect, createCandidate);
router.post('/:id/reparse', protect, reparseCandidate);
router.put('/:id', protect, updateCandidate);
router.delete('/:id', protect, authorize('admin', 'recruiter'), deleteCandidate);

module.exports = router;
