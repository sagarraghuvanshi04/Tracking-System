const router = require('express').Router();
const { scheduleInterview, getInterviews, updateInterview, deleteInterview } = require('../controllers/interviewController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getInterviews);
router.post('/', protect, scheduleInterview);
router.put('/:id', protect, updateInterview);
router.delete('/:id', protect, deleteInterview);

module.exports = router;
