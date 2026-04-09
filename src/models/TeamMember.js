const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id',
    unique: 'project_user_unique'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    unique: 'project_user_unique'
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'editor', 'viewer'),
    defaultValue: 'viewer'
  },
  jobTitle: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'job_title'
  },
  status: {
    type: DataTypes.ENUM('invited', 'active'),
    defaultValue: 'invited'
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'joined_at'
  }
}, {
  timestamps: false,
  underscored: true
});

module.exports = TeamMember;
