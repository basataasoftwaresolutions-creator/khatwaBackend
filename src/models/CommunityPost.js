const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommunityPost = sequelize.define('CommunityPost', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  authorId: { type: DataTypes.INTEGER, allowNull: false, field: 'author_id' },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  tags: DataTypes.JSON,
  status: { 
    type: DataTypes.ENUM('draft', 'scheduled', 'published'), 
    defaultValue: 'published' 
  },
  scheduledAt: { type: DataTypes.DATE, field: 'scheduled_at' },
  likesCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'likes_count' },
  platform: { 
    type: DataTypes.ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'other'), 
    defaultValue: 'other' 
  }
}, { timestamps: true, underscored: true });

module.exports = CommunityPost;
