require('dotenv').config();
const sendEmail = require('../src/utils/sendEmail');

const run = async () => {
  try {
    console.log('Testing Resend with API Key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    await sendEmail({
      email: 'basataasoftwaresolutions@gmail.com', // MUST use the account email for testing until domain is verified
      subject: 'Resend Test',
      message: 'This is a test email sent via Resend API.'
    });
    console.log('Test email sent successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

run();
