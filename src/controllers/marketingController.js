const { MarketingPlan, Project, CommunityPost, CommunityComment } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

// @desc    Get marketing dashboard stats
// @route   GET /api/v1/projects/:projectId/marketing-dashboard
// @access  Private (Owner/Member)
exports.getMarketingDashboardStats = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // 1. Verify Project & Access
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // 2. Active Campaigns (Active Marketing Plans)
    const activeCampaignsCount = await MarketingPlan.count({
      where: {
        projectId,
        isActive: true
      }
    });

    // Calculate remaining days (min days remaining for active campaigns)
    const activeCampaigns = await MarketingPlan.findAll({
      where: {
        projectId,
        isActive: true,
        endDate: { [Op.ne]: null }
      },
      attributes: ['endDate']
    });

    let remainingDays = 0;
    if (activeCampaigns.length > 0) {
      // Find the soonest ending campaign to create urgency? Or the longest? 
      // UI says "15 days remaining" under a count of 3. 
      // Let's assume it's the average remaining days or the max. 
      // Let's go with the one ending soonest (min positive difference) or just the first one.
      // For simplicity, let's take the max remaining days to show "coverage".
      const now = new Date();
      const maxEndDate = activeCampaigns.reduce((max, plan) => {
        const end = new Date(plan.endDate);
        return end > max ? end : max;
      }, new Date(0));
      
      const diffTime = Math.max(0, maxEndDate - now);
      remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }

    // 3. Total Engagement (Likes + Comments on Community Posts)
    // Get all posts by the user
    const posts = await CommunityPost.findAll({
      where: { authorId: req.user.id },
      attributes: ['id', 'likesCount', 'createdAt', 'status']
    });

    let totalLikes = 0;
    const postIds = [];
    const publishedPostsThisMonth = [];
    const publishedPostsLastMonth = [];

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    posts.forEach(post => {
      // Engagement
      totalLikes += (post.likesCount || 0);
      postIds.push(post.id);

      // Published Content Stats
      if (post.status === 'published' || !post.status) { // Handle legacy posts without status
        const postDate = new Date(post.createdAt);
        if (postDate >= startOfCurrentMonth) {
          publishedPostsThisMonth.push(post);
        } else if (postDate >= startOfLastMonth && postDate < startOfCurrentMonth) {
          publishedPostsLastMonth.push(post);
        }
      }
    });

    // Get comment count for these posts
    let totalComments = 0;
    if (postIds.length > 0) {
      totalComments = await CommunityComment.count({
        where: {
          postId: {
            [Op.in]: postIds
          }
        }
      });
    }

    const totalEngagement = totalLikes + totalComments;

    // 4. Scheduled Content
    // Count posts with status 'scheduled' and scheduledAt > now (Next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const scheduledContentCount = await CommunityPost.count({
      where: {
        authorId: req.user.id,
        status: 'scheduled',
        scheduledAt: { 
          [Op.and]: [
            { [Op.gt]: new Date() },
            { [Op.lte]: nextWeek }
          ]
        }
      }
    });

    // 5. Published Content
    const publishedContentCount = posts.filter(p => p.status === 'published' || !p.status).length;
    
    // Calculate Growth
    const currentCount = publishedPostsThisMonth.length;
    const lastCount = publishedPostsLastMonth.length;
    let growth = 0;
    if (lastCount === 0) {
      growth = currentCount > 0 ? 100 : 0;
    } else {
      growth = Math.round(((currentCount - lastCount) / lastCount) * 100);
    }

    // 6. Content Performance (Last 6 Months)
    // We need monthly stats for posts and engagement
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Current month + 5 previous
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const historicalPosts = await CommunityPost.findAll({
      where: {
        authorId: req.user.id,
        createdAt: { [Op.gte]: sixMonthsAgo }
      },
      attributes: ['id', 'createdAt', 'likesCount']
    });

    // We also need comment counts for these posts to calculate total engagement
    const historicalPostIds = historicalPosts.map(p => p.id);
    let historicalComments = [];
    if (historicalPostIds.length > 0) {
      historicalComments = await CommunityComment.findAll({
        where: {
          postId: { [Op.in]: historicalPostIds }
        },
        attributes: ['postId']
      });
    }

    // Initialize last 6 months structure
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const performanceData = [];
    let loopDate = new Date(sixMonthsAgo);
    const currentDate = new Date();
    // Set currentDate to end of month to ensure loop includes current month
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentDate.setDate(0);

    while (loopDate <= currentDate) {
      const monthIndex = loopDate.getMonth();
      const year = loopDate.getFullYear();
      const key = `${year}-${monthIndex}`;
      
      // Avoid duplicates
      if (!performanceData.find(d => d.key === key)) {
        performanceData.push({
          month: months[monthIndex],
          monthAr: monthsAr[monthIndex],
          year: year,
          posts: 0,
          engagement: 0, // Likes + Comments
          key: key // For matching
        });
      }
      
      // Move to next month safely
      loopDate.setMonth(loopDate.getMonth() + 1);
    }

    // Aggregate Data
    historicalPosts.forEach(post => {
      const postDate = new Date(post.createdAt);
      const key = `${postDate.getFullYear()}-${postDate.getMonth()}`;
      
      const monthData = performanceData.find(d => d.key === key);
      if (monthData) {
        monthData.posts += 1;
        monthData.engagement += (post.likesCount || 0);
      }
    });

    historicalComments.forEach(comment => {
      // Find which post this comment belongs to, to get the date
      // Note: This is an approximation. Ideally engagement should be tracked by when the interaction happened, 
      // but usually for simple dashboards we attribute engagement to the post's creation month OR 
      // we need a joined query on Comment.createdAt.
      // Given the requirement "Posts and Engagement over 6 months", it usually means 
      // "Engagement ON posts created in that month" OR "Engagement happened in that month".
      // Let's assume "Engagement happened in that month" is better but harder to query without more complex logic.
      // For simplicity and typical simple dashboard logic: Engagement on the posts created in that month.
      
      const post = historicalPosts.find(p => p.id === comment.postId);
      if (post) {
        const postDate = new Date(post.createdAt);
        const key = `${postDate.getFullYear()}-${postDate.getMonth()}`;
        
        const monthData = performanceData.find(d => d.key === key);
        if (monthData) {
          monthData.engagement += 1;
        }
      }
    });

    // Remove key before sending
    const finalPerformance = performanceData.map(({ key, ...rest }) => rest);

    // 7. Channel Performance (Radar Chart)
    // Group posts by platform and count them (or sum engagement)
    const channelStats = await CommunityPost.findAll({
      where: { authorId: req.user.id },
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'postCount'],
        [sequelize.fn('SUM', sequelize.col('likes_count')), 'totalLikes']
      ],
      group: ['platform']
    });

    const platforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok'];
    const channelPerformance = {};
    
    // Convert to easy lookup object
    const statsMap = {};
    channelStats.forEach(stat => {
      // stat.platform might be null if not set, default to 'other' or skip
      if (stat.platform) {
        statsMap[stat.platform] = {
            count: parseInt(stat.getDataValue('postCount') || 0),
            likes: parseInt(stat.getDataValue('totalLikes') || 0)
        };
      }
    });

    // Determine max value for normalization (0-100 scale)
    // We can use 'postCount' or 'totalLikes' as the metric. 
    // Let's use a combined score or just postCount for simplicity if likes are low.
    // If we want "Performance", engagement (likes) is better. If likes are 0, fall back to count.
    
    let maxScore = 0;
    // Calculate max score first
    platforms.forEach(p => {
      const s = statsMap[p];
      if (s) {
        const score = s.likes + (s.count * 5); 
        if (score > maxScore) maxScore = score;
      }
    });

    if (maxScore === 0) maxScore = 1;

    // Normalize
    platforms.forEach(p => {
      const s = statsMap[p];
      let score = 0;
      if (s) {
        const rawScore = s.likes + (s.count * 5);
        score = Math.round((rawScore / maxScore) * 100);
      }
      channelPerformance[p] = score;
    });

    // 8. Daily Engagement (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyPosts = await CommunityPost.findAll({
      where: {
        authorId: req.user.id,
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: ['id', 'createdAt', 'likesCount']
    });

    // Get comments on ANY of user's posts (not just recent ones) created in last 30 days
    // First find all user posts ids
    const allUserPosts = await CommunityPost.findAll({
      where: { authorId: req.user.id },
      attributes: ['id']
    });
    const allUserPostIds = allUserPosts.map(p => p.id);

    const dailyEngagementMap = {};
    // Initialize last 30 days correctly (from 29 days ago to today)
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      dailyEngagementMap[key] = 0;
    }

    // Sum likes from posts created on that day
    dailyPosts.forEach(p => {
      const key = p.createdAt.toISOString().split('T')[0];
      if (dailyEngagementMap[key] !== undefined) {
        dailyEngagementMap[key] += (p.likesCount || 0);
      }
    });

    // Sum comments created on that day
    if (allUserPostIds.length > 0) {
      const comments = await CommunityComment.findAll({
        where: {
          postId: { [Op.in]: allUserPostIds },
          createdAt: { [Op.gte]: thirtyDaysAgo }
        },
        attributes: ['id', 'createdAt']
      });
      
      comments.forEach(c => {
        const key = c.createdAt.toISOString().split('T')[0];
        if (dailyEngagementMap[key] !== undefined) {
          dailyEngagementMap[key] += 1;
        }
      });
    }

    // Convert to array sorted by date
    const dailyEngagement = Object.entries(dailyEngagementMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate Average and Max
    const values = dailyEngagement.map(d => d.count);
    const totalDaily = values.reduce((a, b) => a + b, 0);
    const dailyAverage = values.length > 0 ? Math.round(totalDaily / values.length) : 0;
    const highestDay = Math.max(...values, 0);

    // 9. Marketing Plan Progress
    let planProgress = {
      percentage: 0,
      milestones: []
    };

    const activePlan = await MarketingPlan.findOne({
      where: { projectId, isActive: true },
      order: [['createdAt', 'DESC']]
    });

    if (activePlan && activePlan.timeline) {
      let timeline = activePlan.timeline;
      // Ensure it's an array
      if (typeof timeline === 'string') {
        try { timeline = JSON.parse(timeline); } catch(e) {}
      }
      
      if (Array.isArray(timeline) && timeline.length > 0) {
        // Calculate progress
        const totalSteps = timeline.length;
        const completedSteps = timeline.filter(t => t.status === 'completed').length;
        // Avoid NaN if totalSteps is 0
        const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        planProgress = {
          percentage,
          milestones: timeline.map((step, index) => ({
            id: index + 1,
            title: step.title || `Step ${index + 1}`,
            subtitle: step.subtitle || step.description || '',
            status: step.status || 'pending' // completed, in_progress, pending
          }))
        };
      }
    }

    // 10. Upcoming Content (Content Calendar)
    // Fetch upcoming scheduled posts and recent drafts
    const upcomingContentData = await CommunityPost.findAll({
      where: {
        authorId: req.user.id,
        status: { [Op.in]: ['scheduled', 'draft'] }
      },
      attributes: ['id', 'title', 'status', 'scheduledAt', 'platform', 'createdAt'],
      order: [
        ['scheduledAt', 'ASC'], // Scheduled items first (by date)
        ['updatedAt', 'DESC']   // Then recent drafts
      ],
      limit: 5
    });
    
    // Format for frontend
    const upcomingContent = upcomingContentData.map(post => {
      let timeLabel = '';
      if (post.scheduledAt) {
        // Simple time formatting
        const date = new Date(post.scheduledAt);
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'م' : 'ص';
        const formattedHours = hours % 12 || 12;
        timeLabel = `${formattedHours}:${minutes} ${ampm}`;
      }
      return {
        id: post.id,
        title: post.title,
        status: post.status,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
        timeLabel
      };
    });

    res.status(200).json({
      success: true,
      data: {
        activeCampaigns: {
          count: activeCampaignsCount,
          remainingDays
        },
        totalEngagement,
        scheduledContent: {
          count: scheduledContentCount,
          period: 'Next Week'
        },
        publishedContent: {
          count: publishedContentCount,
          growth
        },
        contentPerformance: finalPerformance,
        channelPerformance,
        dailyEngagement: {
          chartData: dailyEngagement,
          dailyAverage,
          highestDay
        },
        planProgress,
        upcomingContent,
        smartIdeas: [
          {
            id: 1,
            title: 'نصيحة يومية لرواد الأعمال',
            subtitle: 'محتوى ملهم يساعد على النجاح',
            platform: 'instagram',
            format: 'carousel',
            impact: 'high',
            impactLabel: 'عالية'
          },
          {
            id: 2,
            title: 'قصة نجاح عميل',
            subtitle: 'مشاركة تجربة إيجابية',
            platform: 'facebook',
            format: 'video',
            impact: 'medium',
            impactLabel: 'متوسطة'
          },
          {
            id: 3,
            title: 'إنفوجرافيك عن السوق',
            subtitle: 'بيانات مفيدة بشكل بصري',
            platform: 'linkedin',
            format: 'image',
            impact: 'high',
            impactLabel: 'عالية'
          }
        ]
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create/Generate a marketing plan for a project
// @route   POST /api/v1/projects/:projectId/marketing-plans
// @access  Private (Owner/Admin)
exports.createMarketingPlan = async (req, res, next) => {
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
        message: `User ${req.user.id} is not authorized to create a marketing plan for this project`
      });
    }

    // Check if active plan already exists
    // REMOVED: Allow multiple active plans (campaigns) per project
    /*
    const existingPlan = await MarketingPlan.findOne({
      where: {
        projectId: req.params.projectId,
        isActive: true
      }
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Active marketing plan already exists for this project'
      });
    }
    */

    req.body.projectId = req.params.projectId;

    const plan = await MarketingPlan.create(req.body);

    res.status(201).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active marketing plan for a project
// @route   GET /api/v1/projects/:projectId/marketing-plans
// @access  Private (Member/Owner)
exports.getMarketingPlan = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify access (Owner only for now, can extend to members later)
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this project's plans`
      });
    }

    // Support listing all plans (campaigns)
    if (req.query.all === 'true') {
      const plans = await MarketingPlan.findAll({
        where: { projectId: req.params.projectId },
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        count: plans.length,
        data: plans
      });
    }

    const plan = await MarketingPlan.findOne({
      where: {
        projectId: req.params.projectId,
        isActive: true
      }
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active marketing plan found for this project'
      });
    }

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update marketing plan
// @route   PUT /api/v1/marketing-plans/:id
// @access  Private (Owner/Admin)
exports.updateMarketingPlan = async (req, res, next) => {
  try {
    let plan = await MarketingPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: `Marketing plan not found with id of ${req.params.id}`
      });
    }

    // Verify ownership via project
    const project = await Project.findByPk(plan.projectId);
    
    if (project && project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this plan`
      });
    }

    plan = await plan.update(req.body);

    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete marketing plan
// @route   DELETE /api/v1/marketing-plans/:id
// @access  Private (Admin/Owner)
exports.deleteMarketingPlan = async (req, res, next) => {
  try {
    const plan = await MarketingPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Verify Project Access
    const project = await Project.findByPk(plan.projectId);
    if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
        // Could also check for admin role in team members if needed
        return res.status(403).json({ success: false, message: 'Not authorized to delete plan' });
    }

    await plan.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
