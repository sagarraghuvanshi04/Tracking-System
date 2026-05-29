const router = require('express').Router();
const {
  createApplication,
  getApplications,
  getApplication,
  updateStage,
  addNote,
  toggleShortlist,
  rescoreApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getApplications);
router.get('/:id', protect, getApplication);
router.post('/', protect, createApplication);
router.put('/:id/stage', protect, updateStage);
router.post('/:id/notes', protect, addNote);
router.put('/:id/shortlist', protect, toggleShortlist);
router.post('/:id/rescore', protect, rescoreApplication);

module.exports = router;
