const router = require('express').Router();
const { createJob, getJobs, getJob, updateJob, deleteJob } = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getJobs);
router.get('/:id', protect, getJob);
router.post('/', protect, authorize('admin', 'recruiter'), createJob);
router.put('/:id', protect, authorize('admin', 'recruiter'), updateJob);
router.delete('/:id', protect, authorize('admin'), deleteJob);

module.exports = router;
