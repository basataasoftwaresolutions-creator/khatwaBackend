const Project = require('../models/Project');
const Task = require('../models/Task');
const FinancialRecord = require('../models/FinancialRecord');
const MarketingPlan = require('../models/MarketingPlan');

// @desc    Get analytics dashboard data
// @route   GET /api/v1/analytics/:projectId/dashboard
// @access  Private
exports.getAnalyticsDashboard = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Verify Project Exists & Access
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 1. Task Completion Rate
    const totalTasks = await Task.count({ where: { projectId } });
    const completedTasks = await Task.count({ where: { projectId, status: 'done' } });
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Financial Overview
    const revenue = await FinancialRecord.sum('amount', { where: { projectId, type: 'revenue' } }) || 0;
    const expense = await FinancialRecord.sum('amount', { where: { projectId, type: 'expense' } }) || 0;
    const netProfit = revenue - expense;

    // 3. Marketing Campaign Status
    const totalCampaigns = await MarketingPlan.count({ where: { projectId } });
    const activeCampaigns = await MarketingPlan.count({ where: { projectId, isActive: true } });

    res.status(200).json({
      success: true,
      data: {
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: taskCompletionRate
        },
        finance: {
          revenue,
          expense,
          netProfit
        },
        marketing: {
          totalCampaigns,
          activeCampaigns
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
