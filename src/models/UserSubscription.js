const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const UserSubscription = sequelize.define('UserSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
  planType: { type: DataTypes.ENUM('Free', 'Pro', 'Business'), defaultValue: 'Free', field: 'plan_type' },
  status: { type: DataTypes.ENUM('active', 'canceled', 'expired'), defaultValue: 'active' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'start_date' },
  endDate: { type: DataTypes.DATE, field: 'end_date' },
  paymentDetails: { type: DataTypes.JSON, field: 'payment_details' }
}, { timestamps: false, underscored: true });

module.exports = UserSubscription;
