const axios = require('axios');

const run = async () => {
  try {
    console.log('Registering user in production...');
    const response = await axios.post('https://khatwabackend-production.up.railway.app/api/v1/auth/register', {
      name: 'Resend Test User',
      email: 'basataasoftwaresolutions@gmail.com',
      password: 'password123',
      role: 'user'
    });
    console.log('User registered successfully:', response.data.success);
    console.log('Token:', response.data.token);
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
  }
};

run();
