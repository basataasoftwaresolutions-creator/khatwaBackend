const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OnboardingData = sequelize.define('OnboardingData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id'
  },
  teamSize: {
    type: DataTypes.STRING,
    field: 'team_size'
  },
  businessModel: {
    type: DataTypes.STRING,
    field: 'business_model'
  },
  currentChallenges: {
    type: DataTypes.JSON,
    field: 'current_challenges'
  },
  shortTermGoals: {
    type: DataTypes.JSON,
    field: 'short_term_goals'
  },
  longTermGoals: {
    type: DataTypes.JSON,
    field: 'long_term_goals'
  },
  aiAnalysisResult: {
    type: DataTypes.JSON,
    field: 'ai_analysis_result',
    get() {
      const rawValue = this.getDataValue('aiAnalysisResult');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return rawValue;
        }
      }
      return rawValue;
    }
  }
}, {
  timestamps: true,
  underscored: true
});

module.exports = OnboardingData;
