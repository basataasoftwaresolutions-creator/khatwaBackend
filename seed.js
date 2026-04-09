const { sequelize } = require('./src/config/db');
const { User, Project, MarketingPlan, FinancialRecord, Task, TeamMember, UserSubscription, OnboardingData } = require('./src/models');
require('dotenv').config();

const seedData = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB for seeding...');

    // Clear existing data and sync schema
    if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ force: true });
        console.log('Database cleared and synced.');
    } else {
        await sequelize.sync();
    }

    // 1. Create User
    const user = await User.create({
      name: 'Test Entrepreneur',
      email: 'test@khatwa.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'user'
    });
    console.log(`User created: ${user.name}`);

    // 2. Create Subscription
    await UserSubscription.create({
        userId: user.id,
        planType: 'Pro',
        status: 'active'
    });
    console.log('Subscription created.');

    // 3. Create Project
    const project = await Project.create({
      ownerId: user.id,
      name: 'Khatwa Startup',
      description: 'A platform for entrepreneurs.',
      stage: 'idea'
    });
    console.log(`Project created: ${project.name}`);

    // Create Onboarding Data
    await OnboardingData.create({
        projectId: project.id,
        teamSize: '1-5',
        businessModel: 'SaaS',
        currentChallenges: ['Funding', 'Marketing'],
        shortTermGoals: ['MVP Launch'],
        longTermGoals: ['Global Expansion']
    });
    console.log('Onboarding Data created.');

    // 4. Create Marketing Plan
    await MarketingPlan.create({
        projectId: project.id,
        objectives: ['Brand Awareness', 'Lead Gen'],
        channels: ['LinkedIn', 'Twitter'],
        budget: 5000
    });
    console.log('Marketing Plan created.');

    // 5. Create Financial Record
    await FinancialRecord.create({
        projectId: project.id,
        type: 'expense',
        amount: 150,
        category: 'Software',
        description: 'Cloud Hosting'
    });
    console.log('Financial Record created.');

    // 6. Create Task
    await Task.create({
        projectId: project.id,
        title: 'Design Logo',
        status: 'todo',
        priority: 'high',
        assignedTo: user.id
    });
    console.log('Task created.');

    // 7. Add Team Member
    await TeamMember.create({
        projectId: project.id,
        userId: user.id,
        role: 'owner',
        status: 'active'
    });
    console.log('Team Member added.');

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
};

seedData();
