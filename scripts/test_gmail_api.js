require('dotenv').config();
const sendEmail = require('../src/utils/sendEmail');

const run = async () => {
  try {
    console.log('Testing Gmail API with credentials:');
    console.log('Client ID:', process.env.GMAIL_CLIENT_ID ? 'Present' : 'Missing');
    console.log('Client Secret:', process.env.GMAIL_CLIENT_SECRET ? 'Present' : 'Missing');
    console.log('Refresh Token:', process.env.GMAIL_REFRESH_TOKEN ? 'Present' : 'Missing');

    await sendEmail({
      email: 'basataasoftwaresolutions@gmail.com', // Sending to self for testing
      subject: 'Gmail API Test (Arabic Support)',
      message: 'This is a test email sent via Gmail REST API.\n\nتجربة النص العربي: مرحبًا بك في خطوة!'
    });
    console.log('Test email sent successfully via Gmail API!');
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

run();
