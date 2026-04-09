const { CommunityPost, CommunityComment, User, PostLike } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Get community stats
// @route   GET /api/v1/community/stats
// @access  Private
exports.getCommunityStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalPosts, todaysPosts, postsInteractions, commentsInteractions] = await Promise.all([
      CommunityPost.count(),
      CommunityPost.count({
        where: {
          createdAt: {
            [Op.gte]: today
          }
        }
      }),
      CommunityPost.sum('likesCount'),
      CommunityComment.count()
    ]);

    // Active members: users who posted or commented in the last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const activePosters = await CommunityPost.findAll({
      where: { createdAt: { [Op.gte]: last30Days } },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('author_id')), 'authorId']],
      raw: true
    });

    const activeCommenters = await CommunityComment.findAll({
      where: { createdAt: { [Op.gte]: last30Days } },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('author_id')), 'authorId']],
      raw: true
    });

    const activeMemberIds = new Set([
      ...activePosters.map(p => p.authorId),
      ...activeCommenters.map(c => c.authorId)
    ]);

    res.status(200).json({
      success: true,
      data: {
        activeMembers: activeMemberIds.size,
        totalPosts: totalPosts || 0,
        todaysPosts: todaysPosts || 0,
        interactions: (postsInteractions || 0) + (commentsInteractions || 0)
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get trending topics (top 5 tags)
// @route   GET /api/v1/community/trending-topics
// @access  Private
exports.getTrendingTopics = async (req, res, next) => {
  try {
    // Fetch all posts with tags
    const posts = await CommunityPost.findAll({
      attributes: ['tags']
    });

    // Count tag frequencies
    const tagCounts = {};
    posts.forEach(post => {
      let tags = post.tags;
      
      // Parse if string (SQLite/MySQL sometimes return string for JSON)
      if (typeof tags === 'string') {
        try {
          tags = JSON.parse(tags);
        } catch (e) {
          tags = [];
        }
      }

      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const normalizedTag = tag.trim();
            tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
          }
        });
      }
    });

    // Convert to array and sort
    const sortedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5

    res.status(200).json({
      success: true,
      data: sortedTags
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get top contributors (active members)
// @route   GET /api/v1/community/top-contributors
// @access  Private
exports.getTopContributors = async (req, res, next) => {
  try {
    const contributors = await CommunityPost.findAll({
      attributes: [
        'authorId',
        [sequelize.fn('COUNT', sequelize.col('CommunityPost.id')), 'postCount']
      ],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'avatarUrl', 'jobTitle']
        }
      ],
      group: ['authorId', 'author.id'],
      order: [[sequelize.literal('postCount'), 'DESC']],
      limit: 5
    });

    res.status(200).json({
      success: true,
      data: contributors
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new post
// @route   POST /api/v1/community/posts
// @access  Private
exports.createPost = async (req, res, next) => {
  try {
    const { title, content, tags, scheduledAt, status, platform } = req.body;

    const post = await CommunityPost.create({
      authorId: req.user.id,
      title,
      content,
      tags,
      scheduledAt: scheduledAt || null,
      status: status || 'published',
      platform: platform || 'other'
    });

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all posts
// @route   GET /api/v1/community/posts
// @access  Private
exports.getPosts = async (req, res, next) => {
  try {
    const { search, filter } = req.query;
    const where = {};
    let order = [['createdAt', 'DESC']];

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filter logic
    if (filter === 'mine') {
      where.authorId = req.user.id;
    } else if (filter === 'popular') {
      order = [['likesCount', 'DESC'], ['createdAt', 'DESC']];
    }
    // 'newest' is default, so no change needed for else

    const posts = await CommunityPost.findAll({
      where,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM community_comments AS comments
              WHERE
                comments.post_id = CommunityPost.id
            )`),
            'commentsCount'
          ]
        ]
      },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'email', 'avatarUrl', 'jobTitle']
        }
      ],
      order
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single post
// @route   GET /api/v1/community/posts/:id
// @access  Private
exports.getPost = async (req, res, next) => {
  try {
    const post = await CommunityPost.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'email']
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post not found with id of ${req.params.id}`
      });
    }

    // Get comments for this post
    const comments = await CommunityComment.findAll({
      where: { postId: req.params.id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['name', 'email']
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: {
        ...post.toJSON(),
        comments
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update post
// @route   PUT /api/v1/community/posts/:id
// @access  Private (Author)
exports.updatePost = async (req, res, next) => {
    try {
        let post = await CommunityPost.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: `Post not found with id of ${req.params.id}`
            });
        }

        // Check ownership
        if (post.authorId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this post`
            });
        }

        post = await post.update(req.body);

        res.status(200).json({
            success: true,
            data: post
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Delete post
// @route   DELETE /api/v1/community/posts/:id
// @access  Private (Author/Admin)
exports.deletePost = async (req, res, next) => {
    try {
        const post = await CommunityPost.findByPk(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: `Post not found with id of ${req.params.id}`
            });
        }

        // Check ownership (or admin)
        if (post.authorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this post`
            });
        }

        await post.destroy();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Add comment to post
// @route   POST /api/v1/community/posts/:postId/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const post = await CommunityPost.findByPk(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: `Post not found with id of ${req.params.postId}`
      });
    }

    const comment = await CommunityComment.create({
      postId: req.params.postId,
      authorId: req.user.id,
      content: req.body.content
    });

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Like a post
// @route   PUT /api/v1/community/posts/:id/like
// @access  Private
exports.likePost = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const post = await CommunityPost.findByPk(req.params.id, { 
      transaction: t,
      lock: true 
    });

    if (!post) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: `Post not found with id of ${req.params.id}`
      });
    }

    // Check if user already liked the post
    const existingLike = await PostLike.findOne({
      where: {
        userId: req.user.id,
        postId: req.params.id
      },
      transaction: t
    });

    if (existingLike) {
      // Unlike
      await existingLike.destroy({ transaction: t });
      // Only decrement if greater than 0
      if (post.likesCount > 0) {
        await post.decrement('likesCount', { transaction: t });
      }
    } else {
      // Like
      await PostLike.create({
        userId: req.user.id,
        postId: req.params.id
      }, { transaction: t });
      await post.increment('likesCount', { transaction: t });
    }

    // Reload post within transaction to get updated count and ensure consistency
    await post.reload({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    // Only rollback if transaction is not finished
    if (!t.finished) {
      await t.rollback();
    }
    next(err);
  }
};

// @desc    Delete comment
// @route   DELETE /api/v1/community/comments/:id
// @access  Private (Author/Admin)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await CommunityComment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `Comment not found with id of ${req.params.id}`
      });
    }

    // Check ownership
    if (comment.authorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this comment`
      });
    }

    await comment.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get comments for a post
// @route   GET /api/v1/community/posts/:postId/comments
// @access  Private
exports.getComments = async (req, res, next) => {
    try {
        const comments = await CommunityComment.findAll({
            where: { postId: req.params.postId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (err) {
        next(err);
    }
};
