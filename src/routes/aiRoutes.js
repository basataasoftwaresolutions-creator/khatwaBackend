const express = require('express');
const { runConsultant, runMentor, analyzeOnboarding, generateContentIdeas, chatWithMentor } = require('../controllers/aiController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/consultant', protect, runConsultant);
router.post('/mentor', protect, runMentor);
router.post('/chat', protect, chatWithMentor);
router.post('/onboarding-analysis', protect, analyzeOnboarding);
router.post('/content-ideas', protect, generateContentIdeas);

module.exports = router;

