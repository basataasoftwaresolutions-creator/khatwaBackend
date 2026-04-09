const { FinancialRecord, Project } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Add a financial record (Revenue/Expense)
// @route   POST /api/v1/projects/:projectId/finance
// @access  Private (Owner/Admin)
exports.addRecord = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify ownership
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add financial records to this project`
      });
    }

    req.body.projectId = req.params.projectId;

    // Handle optional fields (title/description)
    if (!req.body.title && req.body.description) {
        // Fallback: if title missing but description exists (old frontend?), use description as title
        req.body.title = req.body.description;
    }

    const record = await FinancialRecord.create(req.body);

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get financial records for a project
// @route   GET /api/v1/projects/:projectId/finance
// @access  Private (Member/Owner)
exports.getRecords = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify access (Owner only for now)
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this project's finances`
      });
    }

    let query = { projectId: req.params.projectId };

    // Date filtering
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date[Op.gte] = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date[Op.lte] = new Date(req.query.endDate);
      }
    }

    const records = await FinancialRecord.findAll({
      where: query,
      order: [['date', 'DESC'], ['id', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get profit/loss summary
// @route   GET /api/v1/projects/:projectId/finance/summary
// @access  Private (Member/Owner)
exports.getFinancialSummary = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify access
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this project's finances`
      });
    }

    // Calculate totals for all time
    const stats = await FinancialRecord.findAll({
      where: { projectId: req.params.projectId },
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['type'],
      raw: true
    });

    let revenue = 0;
    let expense = 0;

    stats.forEach(stat => {
      if (stat.type === 'revenue') revenue = parseFloat(stat.total) || 0;
      if (stat.type === 'expense') expense = parseFloat(stat.total) || 0;
    });

    const netProfit = revenue - expense;
    const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;

    // Calculate trends (compare this month vs last month)
    const today = new Date();
    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const currentMonthStats = await FinancialRecord.findAll({
      where: {
        projectId: req.params.projectId,
        date: { [Op.gte]: firstDayCurrentMonth }
      },
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['type'],
      raw: true
    });

    const lastMonthStats = await FinancialRecord.findAll({
      where: {
        projectId: req.params.projectId,
        date: { [Op.between]: [firstDayLastMonth, lastDayLastMonth] }
      },
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['type'],
      raw: true
    });

    const getAmount = (statsArr, type) => {
      const stat = statsArr.find(s => s.type === type);
      return stat ? parseFloat(stat.total) || 0 : 0;
    };

    const currentRevenue = getAmount(currentMonthStats, 'revenue');
    const currentExpense = getAmount(currentMonthStats, 'expense');
    const lastRevenue = getAmount(lastMonthStats, 'revenue');
    const lastExpense = getAmount(lastMonthStats, 'expense');
    const currentNetProfit = currentRevenue - currentExpense;
    const lastNetProfit = lastRevenue - lastExpense;

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    const revenueGrowth = calculateGrowth(currentRevenue, lastRevenue);
    const expenseGrowth = calculateGrowth(currentExpense, lastExpense);
    const netProfitGrowth = calculateGrowth(currentNetProfit, lastNetProfit);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenue,
        totalExpenses: expense,
        profit: netProfit,
        profitMargin: parseFloat(profitMargin),
        currency: 'SAR',
        trends: {
          revenue: { amount: currentRevenue, growth: parseFloat(revenueGrowth) },
          expense: { amount: currentExpense, growth: parseFloat(expenseGrowth) },
          netProfit: { amount: currentNetProfit, growth: parseFloat(netProfitGrowth) },
          profitMargin: { 
            value: currentRevenue > 0 ? parseFloat(((currentNetProfit / currentRevenue) * 100).toFixed(1)) : 0,
            label: 'نسبة الكفاءة' // As per screenshot
          }
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get chart data for finance dashboard
// @route   GET /api/v1/projects/:projectId/finance/chart-data
// @access  Private (Member/Owner)
exports.getChartData = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Expenses by Category (Pie Chart)
    const expensesByCategory = await FinancialRecord.findAll({
      where: { 
        projectId: req.params.projectId,
        type: 'expense'
      },
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['category'],
      raw: true
    });

    // Monthly Trend (Line Chart) - Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Helper to get monthly data
    const getMonthlyData = async (type) => {
        // This is a bit complex with Sequelize cross-DB, so we'll fetch raw and process in JS for simplicity/compatibility
        const records = await FinancialRecord.findAll({
            where: {
                projectId: req.params.projectId,
                type: type,
                date: { [Op.gte]: sixMonthsAgo }
            },
            attributes: ['amount', 'date'],
            order: [['date', 'ASC']],
            raw: true
        });

        const monthlyMap = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        records.forEach(record => {
            const d = new Date(record.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`; // e.g., 2024-1
            if (!monthlyMap[key]) {
                monthlyMap[key] = { 
                    amount: 0, 
                    monthIndex: d.getMonth(), 
                    year: d.getFullYear(),
                    label: monthNames[d.getMonth()],
                    labelAr: monthNamesAr[d.getMonth()]
                };
            }
            monthlyMap[key].amount += parseFloat(record.amount);
        });

        return Object.values(monthlyMap).sort((a, b) => {
            return (a.year - b.year) || (a.monthIndex - b.monthIndex);
        });
    };

    const monthlyRevenue = await getMonthlyData('revenue');
    const monthlyExpenses = await getMonthlyData('expense');

    // Merge for "Revenue vs Expenses" and "Profit Margin" charts
    // Create a unified list of months
    const allMonths = {};
    [...monthlyRevenue, ...monthlyExpenses].forEach(m => {
        const key = `${m.year}-${m.monthIndex}`;
        if (!allMonths[key]) {
            allMonths[key] = { ...m, revenue: 0, expense: 0 };
        }
    });

    monthlyRevenue.forEach(m => {
        const key = `${m.year}-${m.monthIndex}`;
        allMonths[key].revenue = m.amount;
    });

    monthlyExpenses.forEach(m => {
        const key = `${m.year}-${m.monthIndex}`;
        allMonths[key].expense = m.amount;
    });

    const monthlyTrend = Object.values(allMonths).sort((a, b) => {
        return (a.year - b.year) || (a.monthIndex - b.monthIndex);
    }).map(m => ({
        month: m.label,
        monthAr: m.labelAr,
        revenue: m.revenue,
        expense: m.expense,
        netProfit: m.revenue - m.expense,
        profitMargin: m.revenue > 0 ? ((m.revenue - m.expense) / m.revenue * 100).toFixed(1) : 0
    }));

    res.status(200).json({
      success: true,
      data: {
        expensesByCategory: expensesByCategory.map(e => ({
            category: e.category || 'Uncategorized',
            amount: parseFloat(e.total)
        })),
        monthlyTrend
      }
    });

  } catch (err) {
    next(err);
  }
};

// @desc    Get recent transactions
// @route   GET /api/v1/projects/:projectId/finance/transactions
// @access  Private (Member/Owner)
exports.getRecentTransactions = async (req, res, next) => {
    try {
      const project = await Project.findByPk(req.params.projectId);
  
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
      }
  
      const transactions = await FinancialRecord.findAll({
        where: { projectId: req.params.projectId },
        order: [['date', 'DESC'], ['id', 'DESC']],
        limit: 10
      });
  
      res.status(200).json({
        success: true,
        count: transactions.length,
        data: transactions
      });
    } catch (err) {
      next(err);
    }
};

// @desc    Update a financial record
// @route   PUT /api/v1/projects/:projectId/finance/:recordId
// @access  Private (Owner/Admin)
exports.updateRecord = async (req, res, next) => {
  try {
    const { projectId, recordId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    let record = await FinancialRecord.findOne({
      where: { id: recordId, projectId } // Ensure record belongs to project
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    record = await record.update(req.body);

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a financial record
// @route   DELETE /api/v1/projects/:projectId/finance/:recordId
// @access  Private (Owner/Admin)
exports.deleteRecord = async (req, res, next) => {
  try {
    const { projectId, recordId } = req.params;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const record = await FinancialRecord.findOne({
      where: { id: recordId, projectId }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    await record.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get finance dashboard overview
// @route   GET /api/v1/projects/:projectId/finance-dashboard
// @access  Private (Member/Owner)
exports.getFinanceDashboard = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findByPk(projectId);
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        
        // 1. Calculate Totals
        const revenue = await FinancialRecord.sum('amount', { where: { projectId, type: 'revenue' } }) || 0;
        const expense = await FinancialRecord.sum('amount', { where: { projectId, type: 'expense' } }) || 0;
        const netProfit = revenue - expense;
        const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : 0;
        
        // 2. Recent Transactions (Limit 5)
        const recentTransactions = await FinancialRecord.findAll({
            where: { projectId },
            order: [['date', 'DESC'], ['id', 'DESC']],
            limit: 5
        });
        
        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalRevenue: revenue,
                    totalExpenses: expense,
                    profit: netProfit,
                    profitMargin: parseFloat(profitMargin),
                    currency: 'SAR'
                },
                recentTransactions
            }
        });
    } catch (err) {
        next(err);
    }
};
