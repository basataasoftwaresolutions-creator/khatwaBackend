const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CommunityComment = sequelize.define('CommunityComment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  postId: { type: DataTypes.INTEGER, allowNull: false, field: 'post_id' },
  authorId: { type: DataTypes.INTEGER, allowNull: false, field: 'author_id' },
  content: { type: DataTypes.TEXT, allowNull: false }
}, { timestamps: true, underscored: true, updatedAt: false });

module.exports = CommunityComment;
