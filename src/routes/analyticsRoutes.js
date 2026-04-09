const express = require('express');
const { getAnalyticsDashboard } = require('../controllers/analyticsController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/:projectId/dashboard', getAnalyticsDashboard);

module.exports = router;
