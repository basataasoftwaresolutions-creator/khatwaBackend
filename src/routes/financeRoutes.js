const express = require('express');
const {
  addRecord,
  getRecords,
  getFinancialSummary,
  getChartData,
  getRecentTransactions,
  updateRecord,
  deleteRecord,
  getFinanceDashboard
} = require('../controllers/financeController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/projects/:projectId/finance', addRecord);
router.get('/projects/:projectId/finance', getRecords);
router.get('/projects/:projectId/finance/summary', getFinancialSummary);
router.get('/projects/:projectId/finance/chart-data', getChartData);
router.get('/projects/:projectId/finance/transactions', getRecentTransactions);

router.put('/projects/:projectId/finance/:recordId', updateRecord);
router.delete('/projects/:projectId/finance/:recordId', deleteRecord);
router.get('/projects/:projectId/finance-dashboard', getFinanceDashboard);

module.exports = router;
