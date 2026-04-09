const { Sequelize } = require('sequelize');

// Hardcoded from .env
const sequelize = new Sequelize('khatwa_backend', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function deleteTestUser() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const email = 'test100@gmail.com';
    
    // Find User
    const [users] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`);
    if (users.length === 0) {
      console.log(`User ${email} not found.`);
      return;
    }
    const userId = users[0].id;
    console.log(`Found User ID: ${userId}`);

    // Find Projects
    const [projects] = await sequelize.query(`SELECT * FROM projects WHERE owner_id = ${userId}`);
    const projectIds = projects.map(p => p.id);
    console.log(`Found Project IDs: ${projectIds}`);

    if (projectIds.length > 0) {
        const ids = projectIds.join(',');
        
        // Delete related data manually to be safe (if cascade isn't perfect)
        console.log('Deleting related data...');
        // Corrected table name: financial_records
        await sequelize.query(`DELETE FROM financial_records WHERE project_id IN (${ids})`);
        await sequelize.query(`DELETE FROM tasks WHERE project_id IN (${ids})`);
        await sequelize.query(`DELETE FROM marketing_plans WHERE project_id IN (${ids})`);
        await sequelize.query(`DELETE FROM reports WHERE project_id IN (${ids})`);
        await sequelize.query(`DELETE FROM team_members WHERE project_id IN (${ids})`);
        await sequelize.query(`DELETE FROM onboarding_data WHERE project_id IN (${ids})`);
        
        // Delete Projects
        console.log('Deleting projects...');
        await sequelize.query(`DELETE FROM projects WHERE id IN (${ids})`);
    }

    // Delete User
    console.log('Deleting user...');
    await sequelize.query(`DELETE FROM users WHERE id = ${userId}`);

    console.log(`Successfully deleted user ${email} and all associated data.`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

deleteTestUser();
