const { Project, Task, FinancialRecord, MarketingPlan, TeamMember, OnboardingData, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// @desc    Get project dashboard stats (Tasks, Finance)
// @route   GET /api/v1/projects/:projectId/dashboard
// @access  Private (Owner/Member)
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;

    // 1. Verify Project & Access
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // 2. Task Stats
    const totalTasks = await Task.count({ where: { projectId } });
    const completedTasks = await Task.count({ where: { projectId, status: 'done' } });
    const inProgressTasks = await Task.count({ where: { projectId, status: 'in_progress' } });
    const todoTasks = await Task.count({ where: { projectId, status: 'todo' } });
    
    const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 3. Weekly Activity (Completed Tasks Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today + 6 previous days
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTasks = await Task.findAll({
      where: {
        projectId,
        status: 'done',
        updatedAt: { [Op.gte]: sevenDaysAgo }
      },
      attributes: ['updatedAt']
    });

    // Group by day name (Sun, Mon, etc.)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    const activityMap = new Array(7).fill(0);
    
    weeklyTasks.forEach(task => {
      const dayIndex = new Date(task.updatedAt).getDay();
      activityMap[dayIndex]++;
    });

    // Reorder to show last 7 days starting from 6 days ago
    const weeklyActivity = [];
    let currentDayIndex = new Date(sevenDaysAgo).getDay();
    
    for (let i = 0; i < 7; i++) {
      weeklyActivity.push({
        day: days[currentDayIndex],
        dayAr: arabicDays[currentDayIndex],
        count: activityMap[currentDayIndex]
      });
      currentDayIndex = (currentDayIndex + 1) % 7;
    }

    const totalWeeklyCompleted = weeklyTasks.length;
    const dailyAverage = Number((totalWeeklyCompleted / 7).toFixed(1));

    // 4. Financial Stats (Current Month vs Last Month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Helper to get sum of records by type and date range
    const getSum = async (type, startDate, endDate) => {
      const result = await FinancialRecord.sum('amount', {
        where: {
          projectId,
          type,
          date: { [Op.between]: [startDate, endDate || now] }
        }
      });
      return result || 0;
    };

    // Current Month Data
    const currentRevenue = await getSum('revenue', startOfCurrentMonth);
    const currentExpense = await getSum('expense', startOfCurrentMonth);
    const currentProfit = currentRevenue - currentExpense;
    const profitMargin = currentRevenue > 0 ? Math.round((currentProfit / currentRevenue) * 100) : 0;

    // Last Month Data (for % change)
    const lastRevenue = await getSum('revenue', startOfLastMonth, endOfLastMonth);
    const lastExpense = await getSum('expense', startOfLastMonth, endOfLastMonth);

    // Calculate Percentage Changes
    const calculateChange = (current, last) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - last) / last) * 100);
    };

    const revenueChange = calculateChange(currentRevenue, lastRevenue);
    const expenseChange = calculateChange(currentExpense, lastExpense);

    // Calculate Last Month's Profit Margin for Growth Rate Change
    const lastProfit = lastRevenue - lastExpense;
    const lastProfitMargin = lastRevenue > 0 ? Math.round((lastProfit / lastRevenue) * 100) : 0;
    const profitMarginChange = profitMargin - lastProfitMargin;

    // Calculate Last Month's Task Completion for Task Progress Change
    // Approximation: Tasks created before this month and completed before this month
    const lastTotalTasks = await Task.count({ 
      where: { 
        projectId, 
        createdAt: { [Op.lt]: startOfCurrentMonth } 
      } 
    });
    
    const lastCompletedTasks = await Task.count({ 
      where: { 
        projectId, 
        status: 'done', 
        updatedAt: { [Op.lt]: startOfCurrentMonth } 
      } 
    });

    const lastTaskProgress = lastTotalTasks > 0 ? Math.round((lastCompletedTasks / lastTotalTasks) * 100) : 0;
    const taskProgressChange = taskProgress - lastTaskProgress;

    // Widgets Data Structure
    const widgets = {
      growthRate: {
        value: profitMargin,
        change: profitMarginChange,
        trend: profitMarginChange >= 0 ? 'up' : 'down'
      },
      monthlyExpenses: {
        value: currentExpense,
        change: expenseChange,
        trend: expenseChange >= 0 ? 'up' : 'down'
      },
      taskCompletion: {
        value: taskProgress,
        change: taskProgressChange,
        trend: taskProgressChange >= 0 ? 'up' : 'down'
      },
      totalRevenue: {
        value: currentRevenue,
        change: revenueChange,
        trend: revenueChange >= 0 ? 'up' : 'down'
      }
    };

    // --- NEW: Charts Data (Weekly Tasks & Monthly Performance) ---

    // 1. Weekly Tasks (Planned vs Completed - Last 4 Weeks)
    const weeklyTasksChart = [];
    for (let i = 3; i >= 0; i--) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (i * 7) - 6); // Start of week (e.g. 27 days ago)
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() - (i * 7)); // End of week (e.g. 21 days ago)
      endOfWeek.setHours(23, 59, 59, 999);

      // Planned: Tasks due in this week range
      const plannedCount = await Task.count({
        where: {
          projectId,
          dueDate: { [Op.between]: [startOfWeek, endOfWeek] }
        }
      });

      // Completed: Tasks completed in this week range
      const completedCount = await Task.count({
        where: {
          projectId,
          status: 'done',
          updatedAt: { [Op.between]: [startOfWeek, endOfWeek] }
        }
      });

      weeklyTasksChart.push({
        week: `Week ${4 - i}`,
        weekAr: `الأسبوع ${4 - i}`,
        planned: plannedCount,
        completed: completedCount
      });
    }

    // 2. Monthly Performance (Revenue, Task Completion, Satisfaction - Last 6 Months)
    const monthlyPerformanceChart = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const startOfMonth = new Date(year, monthIndex, 1);
      const endOfMonth = new Date(year, monthIndex + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Revenue
      const revenue = await getSum('revenue', startOfMonth, endOfMonth);

      // Task Completion % for this month
      // Tasks completed this month / (Tasks completed this month + Tasks created this month & still not done?)
      // Simplification: Tasks completed this month / Total Tasks active this month?
      // Let's use: Completed Count / (Completed Count + Created Count in that month) * 100
      // Or just standard "Completion Rate" based on tasks due in that month?
      // Let's go with: Tasks Completed in Month / Total Tasks Due in Month * 100
      const tasksDue = await Task.count({
        where: {
          projectId,
          dueDate: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      });
      const tasksDone = await Task.count({
        where: {
          projectId,
          status: 'done',
          updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
        }
      });
      
      let completionRate = 0;
      if (tasksDue > 0) {
        completionRate = Math.round((tasksDone / tasksDue) * 100);
        if (completionRate > 100) completionRate = 100; // Can happen if completed task wasn't due this month
      } else if (tasksDone > 0) {
        completionRate = 100; // Completed something even if nothing was strictly due
      }

      // Customer Satisfaction (Simulated)
      // Base it on task completion + some randomness, or fixed high value
      let satisfaction = 85 + Math.floor(Math.random() * 10); // 85-95%
      if (completionRate < 50) satisfaction -= 10;
      if (completionRate > 80) satisfaction += 3;
      if (satisfaction > 100) satisfaction = 100;

      monthlyPerformanceChart.push({
        month: months[monthIndex],
        monthAr: monthsAr[monthIndex],
        revenue: Number(revenue), // Ensure number
        taskCompletion: completionRate,
        customerSatisfaction: satisfaction
      });
    }

    // 3. Growth Trends (Quarterly - Revenue, Customers, Market Share)
    // "Customers" proxy: Number of unique users in team or transactions?
    // Let's use number of "Revenue" transactions as proxy for "Sales/Customers" for now, or 0.
    // Market Share: Simulated (e.g., small growth).
    const growthTrendsChart = [];
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    
    // Calculate for current year
    const currentYear = now.getFullYear();
    for (let i = 0; i < 4; i++) {
      const startOfQuarter = new Date(currentYear, i * 3, 1);
      const endOfQuarter = new Date(currentYear, (i * 3) + 3, 0);
      endOfQuarter.setHours(23, 59, 59, 999);

      // Skip future quarters? Or show 0/projection?
      // Mockup shows full year (Q1-Q4) with data.
      // If date is in future, we can project or leave 0.
      const isFuture = startOfQuarter > now;

      let revenue = 0;
      let customers = 0;
      let marketShare = 0;

      if (!isFuture) {
        revenue = await getSum('revenue', startOfQuarter, endOfQuarter);
        // Proxy: Count of revenue transactions as "Customers"
        customers = await FinancialRecord.count({
          where: {
            projectId,
            type: 'revenue',
            date: { [Op.between]: [startOfQuarter, endOfQuarter] }
          }
        });
        // Market Share: Simulated based on revenue (e.g. 1% per 10k revenue) + base 5%
        marketShare = 5 + Math.floor(revenue / 10000); 
      } else {
         // Projection: Use last known values + growth
         // Simple simulation for demo purposes if requested
         revenue = 0; // Or projection
      }

      growthTrendsChart.push({
        quarter: quarters[i],
        revenue: Number(revenue),
        customers: customers,
        marketShare: marketShare
      });
    }

    // 4. Revenue Forecast (Monthly - Actual vs Forecast)
    const revenueForecastChart = [];
    const forecastMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const forecastMonthsAr = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    // Calculate average monthly revenue so far for projection
    let totalRevSoFar = 0;
    let monthsCount = 0;

    // First pass to get actuals and average
    const actualRevenues = [];
    for (let i = 0; i < 12; i++) {
      const startOfMonth = new Date(currentYear, i, 1);
      const endOfMonth = new Date(currentYear, i + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      if (startOfMonth <= now) {
        const rev = await getSum('revenue', startOfMonth, endOfMonth);
        actualRevenues.push(Number(rev));
        totalRevSoFar += Number(rev);
        monthsCount++;
      } else {
        actualRevenues.push(null);
      }
    }
    
    const avgRevenue = monthsCount > 0 ? totalRevSoFar / monthsCount : 0;
    const growthFactor = 1.1; // 10% month-over-month growth for forecast

    let projectionBaseRevenue = monthsCount > 0 ? actualRevenues[monthsCount - 1] : 0;

    for (let i = 0; i < 12; i++) {
      const isActual = actualRevenues[i] !== null;
      let forecast = null;

      if (!isActual) {
        // Simple projection: Previous month * growth
        // Use last known revenue as base
        if (projectionBaseRevenue === 0) projectionBaseRevenue = 1000; // Default base if no revenue yet
        forecast = Math.round(projectionBaseRevenue * growthFactor);
        projectionBaseRevenue = forecast;
      }

      revenueForecastChart.push({
        month: forecastMonths[i],
        monthAr: forecastMonthsAr[i],
        actual: isActual ? actualRevenues[i] : null,
        forecast: forecast
      });
    }

    // 5. Project Setup Progress (Milestones)
    // Try to get AI Roadmap first, otherwise use default milestones
    
    let milestones = [];
    const onboardingData = await OnboardingData.findOne({ where: { projectId } });
    const hasMarketingPlan = (await MarketingPlan.count({ where: { projectId } })) > 0;

    if (onboardingData && onboardingData.aiAnalysisResult && onboardingData.aiAnalysisResult.roadmap) {
      // Use AI Roadmap
      milestones = onboardingData.aiAnalysisResult.roadmap.map((step, index) => ({
        id: index + 1,
        name: step.step,
        nameAr: step.step, // Assuming AI returns Arabic or we use same for both
        description: step.description,
        descriptionAr: step.description,
        completed: index === 0 // Mark first step as completed for demo
      }));
    } else {
      // Use Default Milestones
      const hasTeamMember = (await TeamMember.count({ where: { projectId } })) > 0;

      milestones = [
        {
          id: 1,
          name: 'Create Project',
          nameAr: 'إنشاء المشروع',
          description: 'Create your first project',
          descriptionAr: 'قم بإنشاء مشروعك الأول',
          completed: true
        },
        {
          id: 2,
          name: 'Add Marketing Plan',
          nameAr: 'إضافة خطة تسويقية',
          description: 'Start a custom marketing plan',
          descriptionAr: 'ابدأ خطة تسويقية مخصصة',
          completed: hasMarketingPlan
        },
        {
          id: 3,
          name: 'Add Team',
          nameAr: 'إضافة فريق العمل',
          description: 'Invite team members to collaborate',
          descriptionAr: 'دعوة أعضاء الفريق للتعاون',
          completed: hasTeamMember
        }
      ];
    }

    const completedMilestones = milestones.filter(m => m.completed).length;
    const projectProgress = milestones.length > 0 ? Math.round((completedMilestones / milestones.length) * 100) : 0;

    // 6. Smart Insights (AI/Backend Logic) - Enhanced
    const insights = [];

    // Financial Insight
    if (profitMargin >= 50) {
      insights.push({
        title: 'Strong Financial Performance',
        titleAr: 'أداء مالي قوي',
        description: `Profit margin ${profitMargin}% is excellent! Your financial performance is strong.`,
        descriptionAr: `هامش ربحك ${profitMargin}% ممتاز! أداؤك المالي أعلى من متوسط السوق.`,
        type: 'success',
        confidence: 95
      });
    } else if (profitMargin >= 20) {
      insights.push({
        title: 'Healthy Profit Margin',
        titleAr: 'هامش ربح جيد',
        description: `Profit margin ${profitMargin}% is healthy. Consider optimizing expenses.`,
        descriptionAr: `هامش ربحك ${profitMargin}% جيد. فكر في تحسين المصروفات لزيادة الربحية.`,
        type: 'info',
        confidence: 85
      });
    } else {
      insights.push({
        title: 'Profit Margin Attention',
        titleAr: 'تنبيه هامش الربح',
        description: `Profit margin ${profitMargin}% needs attention. Review your pricing strategy.`,
        descriptionAr: `هامش ربحك ${profitMargin}% يحتاج إلى انتباه. راجع استراتيجية التسعير الخاصة بك.`,
        type: 'warning',
        confidence: 80
      });
    }

    // Productivity Insight
    const incompleteTasks = 100 - taskProgress;
    if (incompleteTasks > 30) {
      insights.push({
        title: 'Efficiency Improvement Opportunity',
        titleAr: 'فرصة لتحسين الكفاءة',
        description: `${incompleteTasks}% of your tasks are incomplete - try completing two tasks daily.`,
        descriptionAr: `${incompleteTasks}% من مهامك لم تكتمل بعد — يمكن تحسين وقت التسليم بإعادة توزيع الأولويات.`,
        type: 'warning',
        confidence: 70
      });
    } else {
      insights.push({
        title: 'High Task Completion',
        titleAr: 'معدل إنجاز ممتاز',
        description: `Great job! You have completed ${taskProgress}% of your tasks.`,
        descriptionAr: `عمل رائع! الفريق يحافظ على أداء ثابت مع معدل إنجاز ${taskProgress}%.`,
        type: 'success',
        confidence: 90
      });
    }

    // Revenue Trend Insight
    if (revenueChange > 0) {
      insights.push({
        title: 'Positive Revenue Trend',
        titleAr: 'اتجاه إيجابي للإيرادات',
        description: `Revenues are growing with a ${revenueChange}% increase compared to last month.`,
        descriptionAr: `الإيرادات في نمو مستمر مع زيادة ${revenueChange}% مقارنة بالشهر الماضي.`,
        type: 'success',
        confidence: 85
      });
    } else if (revenueChange < 0) {
       insights.push({
        title: 'Revenue Dip',
        titleAr: 'انخفاض في الإيرادات',
        description: `Revenues decreased by ${Math.abs(revenueChange)}% compared to last month.`,
        descriptionAr: `انخفضت الإيرادات بنسبة ${Math.abs(revenueChange)}% مقارنة بالشهر الماضي.`,
        type: 'warning',
        confidence: 75
      });
    }

    // Marketing/Strategic Insight (AI-Personalized or Generic)
    if (onboardingData && onboardingData.aiAnalysisResult && onboardingData.aiAnalysisResult.solutions && onboardingData.aiAnalysisResult.solutions.length > 0) {
      // Pick a random advice from the AI Onboarding Analysis
      const solutions = onboardingData.aiAnalysisResult.solutions;
      const randomSolution = solutions[Math.floor(Math.random() * solutions.length)];
      
      insights.push({
        title: 'Strategic Tip',
        titleAr: 'نصيحة استراتيجية',
        description: `Tip: ${randomSolution.advice}`, 
        descriptionAr: `نصيحة: ${randomSolution.advice}`,
        type: 'info', // Distinct color for AI advice
        confidence: 80
      });
    } else if (hasMarketingPlan) {
      insights.push({
        title: 'Marketing Opportunity',
        titleAr: 'فرصة تسويقية',
        description: 'Next week is suitable for launching a marketing campaign.',
        descriptionAr: 'الأسبوع القادم مناسب لإطلاق حملة تسويقية — جمهورك المستهدف أكثر نشاطاً.',
        type: 'info',
        confidence: 88
      });
    }

    // 7. Key Indicators Summary
    // Calculate Highest Monthly Revenue
    const validRevenues = actualRevenues.filter(r => r !== null);
    const highestMonthlyRevenue = validRevenues.length > 0 ? Math.max(...validRevenues) : 0;

    // Calculate Best Week Achievement
    let bestWeekAchievement = 0;
    weeklyTasksChart.forEach(week => {
      if (week.planned > 0) {
        const achievement = Math.round((week.completed / week.planned) * 100);
        if (achievement > bestWeekAchievement) bestWeekAchievement = achievement;
      }
    });
    if (weeklyTasksChart.length === 0 && totalTasks > 0) bestWeekAchievement = taskProgress; // Fallback

    // Calculate Avg Monthly Growth
    let totalGrowth = 0;
    let growthCount = 0;
    for (let i = 1; i < validRevenues.length; i++) {
      if (validRevenues[i-1] > 0) {
        const growth = ((validRevenues[i] - validRevenues[i-1]) / validRevenues[i-1]) * 100;
        totalGrowth += growth;
        growthCount++;
      }
    }
    const avgMonthlyGrowth = growthCount > 0 ? Math.round(totalGrowth / growthCount) : 0;

    // New Customers (Proxy: Distinct revenue transactions in current month)
    const newCustomersCount = await FinancialRecord.count({
      where: {
        projectId,
        type: 'revenue',
        date: { [Op.gte]: startOfCurrentMonth }
      }
    });

    // Churn Rate (Simulated)
    const churnRate = 4.2; // Static simulation as requested in mockup

    // Customer Satisfaction (From latest month in chart)
    const latestSatisfaction = monthlyPerformanceChart.length > 0 
      ? monthlyPerformanceChart[monthlyPerformanceChart.length - 1].customerSatisfaction 
      : 85;

    const keyIndicators = {
      highestMonthlyRevenue,
      bestWeekAchievement,
      avgMonthlyGrowth,
      newCustomersCount,
      churnRate,
      customerSatisfaction: latestSatisfaction
    };

    // 8. Upcoming Tasks (Backend Logic)
    const upcomingTasks = await Task.findAll({
      where: {
        projectId,
        status: { [Op.ne]: 'done' } // Not done
      },
      order: [['dueDate', 'ASC']], // Soonest first
      limit: 5,
      attributes: ['id', 'title', 'priority', 'dueDate', 'status']
    });

    // 8. Recent Activities (Backend Logic)
    // Combine latest from: Tasks, Team, Finance, Marketing
    const recentActivities = [];

    // Latest Completed Tasks
    const latestTasks = await Task.findAll({
      where: { projectId, status: 'done' },
      limit: 3,
      order: [['updatedAt', 'DESC']],
      attributes: ['title', 'updatedAt']
    });
    latestTasks.forEach(task => {
      recentActivities.push({
        type: 'task',
        message: `Task "${task.title}" completed`,
        messageAr: `تم إكمال مهمة "${task.title}"`,
        time: task.updatedAt
      });
    });

    // Latest Team Members Joined
    const latestMembers = await TeamMember.findAll({
      where: { projectId },
      limit: 2,
      order: [['joinedAt', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['name'] }]
    });
    latestMembers.forEach(member => {
      const memberName = member.user ? member.user.name : 'A new member';
      recentActivities.push({
        type: 'team',
        message: `${memberName} joined the team`,
        messageAr: `انضم ${memberName} إلى فريق المشروع`,
        time: member.joinedAt
      });
    });

    // Latest Financial Record
    const latestFinance = await FinancialRecord.findOne({
      where: { projectId },
      order: [['date', 'DESC']],
      attributes: ['type', 'amount', 'date']
    });
    if (latestFinance) {
      const typeAr = latestFinance.type === 'revenue' ? 'إيراد' : 'مصروف';
      recentActivities.push({
        type: 'finance',
        message: `New ${latestFinance.type} recorded: ${latestFinance.amount} SAR`,
        messageAr: `تم تسجيل ${typeAr} جديد بقيمة ${latestFinance.amount} ر.س`,
        time: latestFinance.date
      });
    }

    // Latest Marketing Plan Update
    const latestMarketing = await MarketingPlan.findOne({
      where: { projectId },
      order: [['updatedAt', 'DESC']],
      attributes: ['updatedAt']
    });
    if (latestMarketing) {
      recentActivities.push({
        type: 'marketing',
        message: 'Marketing plan updated',
        messageAr: 'تم تحديث الخطة التسويقية للمشروع',
        time: latestMarketing.updatedAt
      });
    }

    // Sort by time DESC and take top 5
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const finalActivities = recentActivities.slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        widgets,
        charts: {
          weeklyTasks: weeklyTasksChart,
          monthlyPerformance: monthlyPerformanceChart,
          growthTrends: growthTrendsChart,
          revenueForecast: revenueForecastChart
        },
        projectProgress: {
          progress: projectProgress,
          milestones
        },
        keyIndicators,
        insights,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          progress: taskProgress,
          upcoming: upcomingTasks
        },
        recentActivities: finalActivities, // Added this
        activity: {
          weekly: weeklyActivity,
          total: totalWeeklyCompleted,
          dailyAverage
        },
        finance: {
          revenue: currentRevenue,
          revenueChange,
          expenses: currentExpense,
          expensesChange: expenseChange,
          profit: currentProfit,
          profitMargin
        }
      }
    });

  } catch (error) {
    next(error);
  }
};
