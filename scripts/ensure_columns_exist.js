const { sequelize } = require('../src/config/db');
require('../src/models'); // Load all models to populate sequelize.models

const ensureColumnsExist = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful.');

    const queryInterface = sequelize.getQueryInterface();
    const models = sequelize.models;
    const allTablesRaw = await queryInterface.showAllTables();
    const allTables = (Array.isArray(allTablesRaw) ? allTablesRaw : [])
      .map((t) => (typeof t === 'string' ? t : t && typeof t === 'object' ? t.tableName || t.name : null))
      .filter(Boolean);
    const tableNameByLower = new Map(allTables.map((t) => [String(t).toLowerCase(), t]));

    for (const modelName in models) {
      const model = models[modelName];
      const rawTableName = model.getTableName();
      const tableName =
        typeof rawTableName === 'string'
          ? tableNameByLower.get(rawTableName.toLowerCase()) || rawTableName
          : rawTableName;

      console.log(`Checking table: ${tableName} (Model: ${modelName})`);

      try {
        // Get current columns in the database table
        const tableInfo = await queryInterface.describeTable(tableName);
        const existingColumns = Object.keys(tableInfo);

        // Iterate over model attributes to find missing columns
        for (const attributeName in model.rawAttributes) {
          const attribute = model.rawAttributes[attributeName];
          // Use attribute.field as the column name (Sequelize populates this)
          const columnName = attribute.field || attributeName;

          if (!existingColumns.includes(columnName)) {
            console.log(`  - Column '${columnName}' is missing in table '${tableName}'. Adding...`);
            
            try {
              // Add the missing column
              // We pass the attribute definition directly. 
              // Note: addColumn might fail if the table has rows and we add a NOT NULL column without a default value.
              // However, Sequelize usually handles this if defaultValue is specified.
              // If not, it might fail. We'll catch the error.
              await queryInterface.addColumn(tableName, columnName, attribute);
              console.log(`    -> Successfully added column '${columnName}'.`);
            } catch (err) {
              console.error(`    -> Failed to add column '${columnName}':`, err.message);
            }
          }
        }
      } catch (err) {
        // Check for table not found error
        // MySQL: ER_NO_SUCH_TABLE, Postgres: 42P01 (undefined_table)
        const message = String(err && err.message ? err.message : '');
        const isTableMissing =
          (err && err.original && err.original.code === 'ER_NO_SUCH_TABLE') ||
          (err && err.name === 'SequelizeDatabaseError' && message.includes("doesn't exist")) ||
          message.includes('No description found for');

        if (isTableMissing) {
            
            console.log(`  - Table '${tableName}' does not exist. Creating table...`);
            try {
                await model.sync();
                console.log(`    -> Successfully created table '${tableName}'.`);
            } catch (createErr) {
                console.error(`    -> Failed to create table '${tableName}':`, createErr.message);
            }
        } else {
            console.error(`Error describing table ${tableName}:`, err);
        }
      }
    }

    console.log('Column check and sync completed.');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

ensureColumnsExist();
