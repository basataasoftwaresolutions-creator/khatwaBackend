const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserProgress = sequelize.define('UserProgress', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  courseId: { type: DataTypes.INTEGER, field: 'course_id' },
  progressPercent: { type: DataTypes.INTEGER, defaultValue: 0, field: 'progress_percent' },
  completedLessons: { type: DataTypes.JSON, field: 'completed_lessons' }
}, { timestamps: false, underscored: true });

module.exports = UserProgress;
