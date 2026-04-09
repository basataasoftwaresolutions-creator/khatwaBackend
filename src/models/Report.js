const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Report = sequelize.define(
  'Report',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
    createdBy: { type: DataTypes.INTEGER, allowNull: false, field: 'created_by' },
    type: {
      type: DataTypes.ENUM('financial', 'marketing', 'tasks', 'team', 'overall', 'custom'),
      allowNull: false,
      defaultValue: 'overall'
    },
    format: { type: DataTypes.ENUM('pdf', 'excel'), allowNull: false, defaultValue: 'pdf' },
    dateFrom: { type: DataTypes.DATE, allowNull: false, field: 'date_from' },
    dateTo: { type: DataTypes.DATE, allowNull: false, field: 'date_to' },
    status: { type: DataTypes.ENUM('generated', 'failed'), allowNull: false, defaultValue: 'generated' },
    viewsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'views_count' },
    downloadsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'downloads_count' },
    sharesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'shares_count' },
    data: { type: DataTypes.JSON, allowNull: true },
    aiSummary: { type: DataTypes.TEXT, allowNull: true, field: 'ai_summary' }
  },
  { timestamps: true, underscored: true }
);

module.exports = Report;
