const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  projectId: { type: DataTypes.INTEGER, allowNull: false, field: 'project_id' },
  title: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.STRING,
  assignedTo: { type: DataTypes.INTEGER, field: 'assigned_to' },
  status: { type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'), defaultValue: 'todo' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high'), defaultValue: 'medium' },
  dueDate: { type: DataTypes.DATE, field: 'due_date' },
  tags: { type: DataTypes.JSON, defaultValue: [] }
}, { timestamps: true, underscored: true });

module.exports = Task;
