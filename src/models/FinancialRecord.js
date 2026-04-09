const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FinancialRecord = sequelize.define('FinancialRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  type: { type: DataTypes.ENUM('revenue', 'expense'), allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  category: DataTypes.STRING,
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  title: DataTypes.STRING,
  description: DataTypes.STRING,
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' }
}, { timestamps: false, underscored: true });

module.exports = FinancialRecord;
