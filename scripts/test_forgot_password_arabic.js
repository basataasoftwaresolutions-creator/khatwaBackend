
require('dotenv').config();
const { User } = require('../src/models');
const { sequelize } = require('../src/config/db');
const authController = require('../src/controllers/authController');

const run = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected.');

    const email = 'engabdelrhmanyasser100@gmail.com';
    
    // Check if user exists, if not create one
    let user = await User.findOne({ where: { email } });
    if (!user) {
        console.log('User not found, creating test user...');
        user = await User.create({
            name: 'Test User',
            email: email,
            password: 'password123',
            role: 'user'
        });
    }

    console.log(`Testing forgotPassword flow for ${email}...`);

    // Mock Request
    const req = {
      body: { email },
      protocol: 'http',
      get: () => 'localhost:5000'
    };

    // Mock Response
    const res = {
      status: (code) => {
        console.log(`Response Status: ${code}`);
        return {
          json: (data) => {
            console.log('Response JSON:', JSON.stringify(data, null, 2));
          }
        };
      }
    };

    // Mock Next
    const next = (err) => {
      console.error('Error passed to next:', err);
    };

    await authController.forgotPassword(req, res, next);
    console.log('Test completed.');

  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await sequelize.close();
  }
};

run();
