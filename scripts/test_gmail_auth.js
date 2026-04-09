require('dotenv').config();
const { google } = require('googleapis');

const run = async () => {
  try {
    console.log('Testing Gmail API Authentication...');
    console.log('Using Client ID:', process.env.GMAIL_CLIENT_ID);
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    console.log('Attempting to refresh access token...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    console.log('Access Token Refreshed Successfully!');
    console.log('New Access Token:', credentials.access_token.substring(0, 10) + '...');
    
    // If successful, try sending
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    // ... send logic
    console.log('Authentication checks out. The sendEmail utility should work.');

  } catch (error) {
    console.error('Authentication Test Failed:', error.message);
    if (error.response) {
        console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

run();
