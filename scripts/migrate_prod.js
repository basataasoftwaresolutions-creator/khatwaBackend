const { sequelize } = require('../src/config/db');
require('../src/models'); // Load all models

const runMigration = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful.');

    console.log('Running migration (sync alter: true)...');
    // This will update the database schema to match the models
    // It adds new columns without deleting data (usually)
    await sequelize.sync({ alter: true });
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
