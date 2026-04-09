const User = require('./User');
const Project = require('./Project');
const MarketingPlan = require('./MarketingPlan');
const FinancialRecord = require('./FinancialRecord');
const Task = require('./Task');
const TeamMember = require('./TeamMember');
const CommunityPost = require('./CommunityPost');
const CommunityComment = require('./CommunityComment');
const UserSubscription = require('./UserSubscription');
const UserProgress = require('./UserProgress');
const OnboardingData = require('./OnboardingData');
const PostLike = require('./PostLike');
const Report = require('./Report');

// User <-> Project (Ownership)
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects', onDelete: 'CASCADE' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User <-> TeamMember
User.hasMany(TeamMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Project <-> TeamMember
Project.hasMany(TeamMember, { foreignKey: 'projectId', onDelete: 'CASCADE' });
TeamMember.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> Project (Many-to-Many via TeamMember)
User.belongsToMany(Project, { through: TeamMember, foreignKey: 'userId', as: 'projects' });
Project.belongsToMany(User, { through: TeamMember, foreignKey: 'projectId', as: 'members' });

// Project <-> MarketingPlan
Project.hasMany(MarketingPlan, { foreignKey: 'projectId', onDelete: 'CASCADE' });
MarketingPlan.belongsTo(Project, { foreignKey: 'projectId' });

// Project <-> FinancialRecord
Project.hasMany(FinancialRecord, { foreignKey: 'projectId', onDelete: 'CASCADE' });
FinancialRecord.belongsTo(Project, { foreignKey: 'projectId' });

// Project <-> Task
Project.hasMany(Task, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> Task (Assignment)
User.hasMany(Task, { foreignKey: 'assignedTo', as: 'assignedTasks', onDelete: 'SET NULL' });
Task.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });

// Project <-> OnboardingData
Project.hasOne(OnboardingData, { foreignKey: 'projectId', as: 'onboardingData', onDelete: 'CASCADE' });
OnboardingData.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> CommunityPost
User.hasMany(CommunityPost, { foreignKey: 'authorId', onDelete: 'CASCADE' });
CommunityPost.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// User <-> CommunityComment
User.hasMany(CommunityComment, { foreignKey: 'authorId', onDelete: 'CASCADE' });
CommunityComment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// CommunityPost <-> CommunityComment
CommunityPost.hasMany(CommunityComment, { foreignKey: 'postId', onDelete: 'CASCADE' });
CommunityComment.belongsTo(CommunityPost, { foreignKey: 'postId' });

// User <-> UserSubscription
User.hasMany(UserSubscription, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserSubscription.belongsTo(User, { foreignKey: 'userId' });

// User <-> UserProgress
User.hasMany(UserProgress, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserProgress.belongsTo(User, { foreignKey: 'userId' });

// User <-> PostLike
User.hasMany(PostLike, { foreignKey: 'userId', onDelete: 'CASCADE' });
PostLike.belongsTo(User, { foreignKey: 'userId' });

// CommunityPost <-> PostLike
CommunityPost.hasMany(PostLike, { foreignKey: 'postId', onDelete: 'CASCADE' });
PostLike.belongsTo(CommunityPost, { foreignKey: 'postId' });

// Project <-> Report
Project.hasMany(Report, { foreignKey: 'projectId', onDelete: 'CASCADE' });
Report.belongsTo(Project, { foreignKey: 'projectId' });

// User <-> Report
User.hasMany(Report, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
Report.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  User,
  Project,
  MarketingPlan,
  FinancialRecord,
  Task,
  TeamMember,
  CommunityPost,
  CommunityComment,
  UserSubscription,
  UserProgress,
  OnboardingData,
  PostLike,
  Report
};
