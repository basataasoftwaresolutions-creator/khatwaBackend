const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PostLike = sequelize.define('PostLike', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  postId: { type: DataTypes.INTEGER, allowNull: false, field: 'post_id' }
}, { 
  timestamps: true, 
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id']
    }
  ]
});

module.exports = PostLike;
