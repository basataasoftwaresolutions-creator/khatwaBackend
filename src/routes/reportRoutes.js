const express = require('express');
const { protect } = require('../middlewares/auth');
const { getReportsOverview, listReports, getReport, createReport, trackReportEvent } = require('../controllers/reportController');

const router = express.Router();

router.use(protect);

router.get('/projects/:projectId/reports/overview', getReportsOverview);
router.get('/projects/:projectId/reports', listReports);
router.get('/reports/:reportId', getReport);
router.post('/projects/:projectId/reports', createReport);
router.post('/reports/:reportId/track', trackReportEvent);

module.exports = router;
