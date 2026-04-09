require('dotenv').config();

const { sequelize } = require('../src/config/db');
const models = require('../src/models');

const main = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/delete_user_by_email.js <email>');
    process.exit(1);
  }

  await sequelize.authenticate();

  const user = await models.User.findOne({ where: { email } });
  if (!user) {
    console.log(JSON.stringify({ email, deleted: false, reason: 'not_found' }, null, 2));
    return;
  }

  await sequelize.transaction(async (t) => {
    const tx = { transaction: t };

    await models.PostLike.destroy({ where: { userId: user.id }, ...tx });
    await models.CommunityComment.destroy({ where: { authorId: user.id }, ...tx });
    await models.CommunityPost.destroy({ where: { authorId: user.id }, ...tx });

    await models.Report.destroy({ where: { createdBy: user.id }, ...tx });
    await models.UserSubscription.destroy({ where: { userId: user.id }, ...tx });
    await models.UserProgress.destroy({ where: { userId: user.id }, ...tx });

    await models.Task.destroy({ where: { assignedTo: user.id }, ...tx });
    await models.TeamMember.destroy({ where: { userId: user.id }, ...tx });

    const ownedProjects = await models.Project.findAll({ where: { ownerId: user.id }, ...tx });
    for (const project of ownedProjects) {
      await models.Report.destroy({ where: { projectId: project.id }, ...tx });
      await models.TeamMember.destroy({ where: { projectId: project.id }, ...tx });
      await models.Task.destroy({ where: { projectId: project.id }, ...tx });
      await models.FinancialRecord.destroy({ where: { projectId: project.id }, ...tx });
      await models.MarketingPlan.destroy({ where: { projectId: project.id }, ...tx });
      await models.OnboardingData.destroy({ where: { projectId: project.id }, ...tx });
      await models.Project.destroy({ where: { id: project.id }, ...tx });
    }

    await models.User.destroy({ where: { id: user.id }, ...tx });
  });

  console.log(JSON.stringify({ email, deleted: true }, null, 2));
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await sequelize.close();
    } catch {}
  });
