require('dotenv').config();

const { sequelize } = require('../src/config/db');
const { User, Project, OnboardingData } = require('../src/models');

const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) acc[key] = obj[key];
    return acc;
  }, {});

const main = async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/check_onboarding_by_email.js <email>');
    process.exit(1);
  }

  await sequelize.authenticate();

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log(JSON.stringify({ email, found: false }, null, 2));
    return;
  }

  const projects = await Project.findAll({
    where: { ownerId: user.id },
    order: [['createdAt', 'DESC']]
  });

  const projectsWithOnboarding = await Promise.all(
    projects.map(async (project) => {
      const onboarding = await OnboardingData.findOne({ where: { projectId: project.id } });
      return {
        project: pick(project.toJSON(), ['id', 'name', 'stage', 'industry', 'createdAt', 'updatedAt']),
        onboarding: onboarding
          ? pick(onboarding.toJSON(), [
              'id',
              'teamSize',
              'currentChallenges',
              'shortTermGoals',
              'longTermGoals',
              'createdAt',
              'updatedAt'
            ])
          : null,
        hasAiAnalysisResult: Boolean(onboarding && onboarding.aiAnalysisResult)
      };
    })
  );

  console.log(
    JSON.stringify(
      {
        email,
        found: true,
        user: pick(user.toJSON(), ['id', 'name', 'email', 'role', 'createdAt', 'updatedAt']),
        ownedProjectsCount: projects.length,
        projects: projectsWithOnboarding
      },
      null,
      2
    )
  );
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

