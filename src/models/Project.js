const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'owner_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING
  },
  industry: {
    type: DataTypes.STRING
  },
  stage: {
    type: DataTypes.ENUM('idea', 'planning', 'execution', 'operating'),
    defaultValue: 'idea',
    validate: {
      isIn: {
        args: [['idea', 'planning', 'execution', 'operating']],
        msg: "Stage must be one of: 'idea', 'planning', 'execution', 'operating'"
      }
    }
  },
  logoUrl: {
    type: DataTypes.STRING,
    field: 'logo_url'
  }
}, {
  timestamps: true,
  underscored: true
});

module.exports = Project;
