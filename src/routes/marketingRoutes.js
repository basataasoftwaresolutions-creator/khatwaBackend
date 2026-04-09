const express = require('express');
const {
  createMarketingPlan,
  getMarketingPlan,
  updateMarketingPlan,
  deleteMarketingPlan,
  getMarketingDashboardStats
} = require('../controllers/marketingController');

const { protect } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router.get('/projects/:projectId/marketing-dashboard', getMarketingDashboardStats); // New route
router.post('/projects/:projectId/marketing-plans', createMarketingPlan);
router.get('/projects/:projectId/marketing-plans', getMarketingPlan);
router.put('/marketing-plans/:id', updateMarketingPlan);
router.delete('/marketing-plans/:id', deleteMarketingPlan);

module.exports = router;
