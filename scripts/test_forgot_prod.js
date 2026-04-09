const axios = require('axios');

const run = async () => {
  try {
    console.log('Sending forgot password request...');
    const response = await axios.post('https://khatwabackend-production.up.railway.app/api/v1/auth/forgotpassword', {
      email: 'basataasoftwaresolutions@gmail.com'
    });
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error Status:', error.response?.status);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    if (!error.response) console.error('Error Message:', error.message);
  }
};

run();
