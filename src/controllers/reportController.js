const axios = require('axios');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const {
  Project,
  Report,
  User,
  FinancialRecord,
  Task,
  TeamMember,
  CommunityPost,
  CommunityComment,
  PostLike,
  MarketingPlan
} = require('../models');

const callGemini = async prompt => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const error = new Error('GEMINI_API_KEY is not configured');
    error.statusCode = 500;
    throw error;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    },
    {
      timeout: 60000
    }
  );

  const candidates = response.data && response.data.candidates;

  if (!candidates || !candidates.length) {
    return '';
  }

  const parts = candidates[0].content && candidates[0].content.parts;

  if (!parts || !parts.length) {
    return '';
  }

  return parts.map(part => part.text || '').join('');
};

const parseDate = value => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date;
};

const normalizeDateRange = (dateFromRaw, dateToRaw) => {
  const now = new Date();
  const dateTo = parseDate(dateToRaw) || now;
  const dateFrom = parseDate(dateFromRaw) || new Date(dateTo.getTime() - 29 * 24 * 60 * 60 * 1000);

  const from = new Date(dateFrom);
  from.setHours(0, 0, 0, 0);

  const to = new Date(dateTo);
  to.setHours(23, 59, 59, 999);

  return { dateFrom: from, dateTo: to };
};

const getTemplates = () => [
  { id: 1, type: 'marketing', titleAr: 'تقرير التسويق' },
  { id: 2, type: 'financial', titleAr: 'التقرير المالي' },
  { id: 3, type: 'tasks', titleAr: 'تقرير المهام' },
  { id: 4, type: 'team', titleAr: 'تقرير الفريق' },
  { id: 5, type: 'overall', titleAr: 'تقرير الأداء الشامل' },
  { id: 6, type: 'custom', titleAr: 'تقرير مخصص' }
];

const getLast7Months = () => {
  const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const months = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: arMonths[d.getMonth()],
      year: d.getFullYear(),
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      count: 0
    });
  }
  return months;
};

const buildFinancialReport = async (projectId, dateFrom, dateTo) => {
  const where = { projectId, date: { [Op.between]: [dateFrom, dateTo] } };

  // Use Promise.all to fetch aggregate data
  const revenue = (await FinancialRecord.sum('amount', { where: { ...where, type: 'revenue' } })) || 0;
  const expenses = (await FinancialRecord.sum('amount', { where: { ...where, type: 'expense' } })) || 0;
  const profit = revenue - expenses;
  const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const byCategoryRaw = await FinancialRecord.findAll({
    where,
    attributes: ['type', 'category', [sequelize.fn('SUM', sequelize.col('amount')), 'total']],
    group: ['type', 'category'],
    raw: true
  });

  const byCategory = byCategoryRaw.map(r => ({
    type: r.type,
    category: r.category,
    total: Number(r.total || 0)
  }));

  return {
    revenue,
    expenses,
    profit,
    profitMargin,
    byCategory
  };
};

const buildTasksReport = async (projectId, dateFrom, dateTo) => {
  const where = { projectId, createdAt: { [Op.between]: [dateFrom, dateTo] } };

  const total = await Task.count({ where });
  const completed = await Task.count({ where: { ...where, status: 'done' } });
  const inProgress = await Task.count({ where: { ...where, status: 'in_progress' } });
  const todo = await Task.count({ where: { ...where, status: 'todo' } });

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const overdue = await Task.count({
    where: {
      projectId,
      status: { [Op.ne]: 'done' },
      dueDate: { [Op.lt]: new Date() }
    }
  });

  return {
    total,
    completed,
    inProgress,
    todo,
    overdue,
    completionRate
  };
};

const buildTeamReport = async (projectId, dateFrom, dateTo) => {
  const totalMembers = await TeamMember.count({ where: { projectId } });

  const newMembers = await TeamMember.count({
    where: {
      projectId,
      joinedAt: { [Op.between]: [dateFrom, dateTo] }
    }
  });

  const activeMembers = await TeamMember.count({
    where: {
      projectId,
      status: 'active'
    }
  });

  const rolesRaw = await TeamMember.findAll({
    where: { projectId },
    attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['role'],
    raw: true
  });

  const rolesDistribution = rolesRaw.map(r => ({
    role: r.role,
    count: Number(r.count || 0)
  }));

  return {
    totalMembers,
    newMembers,
    activeMembers,
    rolesDistribution
  };
};

const buildMarketingReport = async (projectId, dateFrom, dateTo) => {
  // We need to find the project owner to get their posts
  const project = await Project.findByPk(projectId);
  if (!project) return {}; // Should not happen as verified before

  const userId = project.ownerId;

  const postsTotal = await CommunityPost.count({
    where: {
      authorId: userId,
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    }
  });

  const postsPublished = await CommunityPost.count({
    where: {
      authorId: userId,
      status: 'published',
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    }
  });

  const postsScheduled = await CommunityPost.count({
    where: {
      authorId: userId,
      status: 'scheduled',
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    }
  });

  const postsDraft = await CommunityPost.count({
    where: {
      authorId: userId,
      status: 'draft',
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    }
  });

  // Calculate Engagement (Likes + Comments)
  const posts = await CommunityPost.findAll({
    where: {
      authorId: userId,
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    },
    attributes: ['id', 'likesCount']
  });

  const likesCount = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const postIds = posts.map(p => p.id);

  let commentsCount = 0;
  if (postIds.length > 0) {
    commentsCount = await CommunityComment.count({
      where: {
        postId: { [Op.in]: postIds }
      }
    });
  }

  const engagementTotal = likesCount + commentsCount;

  // Platform Distribution
  const platformRaw = await CommunityPost.findAll({
    where: {
      authorId: userId,
      createdAt: { [Op.between]: [dateFrom, dateTo] }
    },
    attributes: ['platform', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['platform'],
    raw: true
  });

  const platformDistribution = platformRaw
    .filter(r => r.platform)
    .map(r => ({
      platform: r.platform,
      count: Number(r.count || 0)
    }));

  return {
    postsTotal,
    postsPublished,
    postsScheduled,
    postsDraft,
    engagementTotal,
    likesCount,
    commentsCount,
    platformDistribution
  };
};

const buildOverallReport = async (projectId, userId, dateFrom, dateTo) => {
  const [financial, tasks, team, marketing] = await Promise.all([
    buildFinancialReport(projectId, dateFrom, dateTo),
    buildTasksReport(projectId, dateFrom, dateTo),
    buildTeamReport(projectId, dateFrom, dateTo),
    buildMarketingReport(projectId, dateFrom, dateTo) // Fix: use projectId instead of userId
  ]);

  const activeCampaigns = await MarketingPlan.count({
    where: { projectId, isActive: true }
  });

  return {
    financial,
    tasks,
    team,
    marketing,
    activeCampaigns
  };
};

const generateArabicSummary = async ({ reportType, projectName, dateFrom, dateTo, reportData }) => {
  const prompt = `أنت محلل أعمال محترف.
أنشئ ملخصاً عربياً قصيراً ومفيداً لتقرير "${reportType}" لمشروع اسمه "${projectName}" للفترة من ${dateFrom.toISOString().slice(0, 10)} إلى ${dateTo
    .toISOString()
    .slice(0, 10)}.

المعطيات (JSON):
${JSON.stringify(reportData)}

المخرجات المطلوبة:
- 6 إلى 10 نقاط قصيرة باللغة العربية.
- أبرز الأرقام المهمة.
- 3 توصيات عملية قابلة للتنفيذ.
لا تستخدم Markdown.`;

  const text = await callGemini(prompt);
  return (text || '').trim();
};

const buildFallbackArabicSummary = ({ type, reportData }) => {
  if (type === 'financial') {
    return `ملخص مالي: الإيرادات ${Math.round(reportData.revenue || 0)} والمصروفات ${Math.round(reportData.expenses || 0)} وصافي الربح ${Math.round(
      reportData.profit || 0
    )}. هامش الربح ${reportData.profitMargin || 0}%. توصيات: راجع أكبر فئات المصروفات، وحسّن التسعير، وخصص ميزانية تسويق مرتبطة بالعائد.`;
  }

  if (type === 'marketing') {
    return `ملخص تسويق: إجمالي المنشورات ${reportData.postsTotal || 0}، التفاعل ${reportData.engagementTotal || 0} (إعجابات ${
      reportData.likesCount || 0
    } + تعليقات ${reportData.commentsCount || 0}). توصيات: زد المحتوى على المنصات الأعلى أداءً، وجدول منشورات منتظمة، واختبر صيغ مختلفة (فيديو/كاروسيل).`;
  }

  if (type === 'tasks') {
    return `ملخص المهام: إجمالي ${reportData.total || 0}، مكتمل ${reportData.completed || 0}، قيد التنفيذ ${
      reportData.inProgress || 0
    }، للإنجاز ${reportData.todo || 0}. نسبة الإنجاز ${reportData.completionRate || 0}%. توصيات: راقب المهام المتأخرة، قسّم المهام الكبيرة، وحدد أولويات أسبوعية.`;
  }

  if (type === 'team') {
    return `ملخص الفريق: إجمالي الأعضاء ${reportData.totalMembers || 0}، أعضاء جدد ${reportData.newMembers || 0}. توصيات: حدّد أدوار واضحة، راجع سير العمل أسبوعياً، وحسّن توزيع المهام حسب القدرات.`;
  }

  return `ملخص شامل: راجع أداء المالية والتسويق والمهام خلال الفترة الحالية، وركّز على تحسين المؤشرات الأضعف. توصيات: ضع أهداف أسبوعية، راقب المصروفات، وزد المحتوى عالي التفاعل.`;
};

const verifyProjectOwner = async (projectId, userId) => {
  const project = await Project.findByPk(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }
  if (project.ownerId !== userId) {
    const error = new Error('Not authorized');
    error.statusCode = 403;
    throw error;
  }
  return project;
};

exports.getReportsOverview = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await verifyProjectOwner(projectId, req.user.id);

    // Calculate start date for last 7 months
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    startDate.setHours(0, 0, 0, 0);

    const [totalReports, totalViews, totalDownloads, totalShares, recentReports] = await Promise.all([
      Report.count({ where: { projectId } }),
      Report.sum('viewsCount', { where: { projectId } }),
      Report.sum('downloadsCount', { where: { projectId } }),
      Report.sum('sharesCount', { where: { projectId } }),
      Report.findAll({
        where: { 
          projectId,
          createdAt: { [Op.gte]: startDate }
        },
        attributes: ['createdAt']
      })
    ]);

    // Process chart data
    const chartData = getLast7Months();
    recentReports.forEach(r => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const m = chartData.find(item => item.key === key);
      if (m) m.count++;
    });

    // Clean up chart data keys
    const finalChartData = chartData.map(({ month, count }) => ({ month, count }));

    res.status(200).json({
      success: true,
      data: {
        overview: {
          views: Number(totalViews || 0),
          shares: Number(totalShares || 0),
          downloads: Number(totalDownloads || 0),
          totalReports: Number(totalReports || 0)
        },
        chartData: finalChartData,
        templates: getTemplates()
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.listReports = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    await verifyProjectOwner(projectId, req.user.id);

    const limit = Math.min(Number(req.query.limit || 20), 100);
    const offset = Math.max(Number(req.query.offset || 0), 0);
    const { type, search } = req.query;

    const where = { projectId };

    if (type) {
      where.type = type;
    }

    if (search) {
      where[Op.or] = [
        { type: { [Op.like]: `%${search}%` } },
        { status: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Report.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'avatarUrl']
        }
      ],
      attributes: [
        'id',
        'type',
        'format',
        'dateFrom',
        'dateTo',
        'status',
        'viewsCount',
        'downloadsCount',
        'sharesCount',
        'createdAt'
      ]
    });

    res.status(200).json({
      success: true,
      count,
      data: rows
    });
  } catch (err) {
    next(err);
  }
};

exports.getReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findByPk(reportId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name']
        }
      ],
      attributes: [
        'id',
        'projectId',
        'createdBy',
        'type',
        'format',
        'dateFrom',
        'dateTo',
        'status',
        'viewsCount',
        'downloadsCount',
        'sharesCount',
        'data',
        'aiSummary',
        'createdAt'
      ]
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await verifyProjectOwner(report.projectId, req.user.id);

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};

exports.createReport = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await verifyProjectOwner(projectId, req.user.id);

    const type = (req.body.type || 'overall').toString();
    const format = (req.body.format || 'pdf').toString();
    const { dateFrom, dateTo } = normalizeDateRange(req.body.dateFrom || req.body.fromDate, req.body.dateTo || req.body.toDate);

    const allowedTypes = new Set(['financial', 'marketing', 'tasks', 'team', 'overall', 'custom']);
    const allowedFormats = new Set(['pdf', 'excel']);

    if (!allowedTypes.has(type) && type !== 'overall') {
       // Allow overall if logic permits
    }
    // Correct checking
    if (!['financial', 'marketing', 'tasks', 'team', 'overall', 'custom'].includes(type)) {
       return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    
    // Check format
    if (!['pdf', 'excel'].includes(format)) {
       return res.status(400).json({ success: false, message: 'Invalid report format' });
    }

    let reportData = {};
    if (type === 'financial') reportData = await buildFinancialReport(projectId, dateFrom, dateTo);
    else if (type === 'marketing') reportData = await buildMarketingReport(projectId, dateFrom, dateTo); // Use projectId, not userId
    else if (type === 'tasks') reportData = await buildTasksReport(projectId, dateFrom, dateTo);
    else if (type === 'team') reportData = await buildTeamReport(projectId, dateFrom, dateTo);
    else reportData = await buildOverallReport(projectId, req.user.id, dateFrom, dateTo);

    let aiSummary = '';
    try {
      aiSummary = await generateArabicSummary({
        reportType: type,
        projectName: project.name,
        dateFrom,
        dateTo,
        reportData
      });
    } catch (e) {
      aiSummary = buildFallbackArabicSummary({ type, reportData });
    }

    const report = await Report.create({
      projectId,
      createdBy: req.user.id,
      type,
      format,
      dateFrom,
      dateTo,
      status: 'generated',
      data: reportData,
      aiSummary
    });

    res.status(201).json({
      success: true,
      data: {
        reportId: report.id,
        projectId: report.projectId,
        type: report.type,
        format: report.format,
        dateFrom: report.dateFrom,
        dateTo: report.dateTo,
        status: report.status,
        data: report.data,
        aiSummary: report.aiSummary
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.trackReportEvent = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const action = (req.body.action || '').toString();

    const report = await Report.findByPk(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    await verifyProjectOwner(report.projectId, req.user.id);

    if (!['view', 'download', 'share'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const updates = {};
    if (action === 'view') updates.viewsCount = (report.viewsCount || 0) + 1;
    if (action === 'download') updates.downloadsCount = (report.downloadsCount || 0) + 1;
    if (action === 'share') updates.sharesCount = (report.sharesCount || 0) + 1;

    await report.update(updates);

    res.status(200).json({
      success: true,
      data: {
        id: report.id,
        viewsCount: report.viewsCount,
        downloadsCount: report.downloadsCount,
        sharesCount: report.sharesCount
      }
    });
  } catch (err) {
    next(err);
  }
};
