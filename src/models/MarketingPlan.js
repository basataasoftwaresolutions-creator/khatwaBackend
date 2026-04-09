const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MarketingPlan = sequelize.define('MarketingPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  objectives: DataTypes.JSON,
  targetAudience: { type: DataTypes.JSON, field: 'target_audience' },
  channels: DataTypes.JSON,
  contentStrategy: { type: DataTypes.TEXT, field: 'content_strategy' },
  timeline: DataTypes.JSON,
  startDate: { type: DataTypes.DATE, field: 'start_date' },
  endDate: { type: DataTypes.DATE, field: 'end_date' },
  budget: DataTypes.DECIMAL(10, 2),
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, { timestamps: true, underscored: true });

module.exports = MarketingPlan;
