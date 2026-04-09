require('dotenv').config();
const { google } = require('googleapis');

const run = async () => {
  try {
    console.log('Testing Gmail API with Access Token...');
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    
    // User provided access token
    const accessToken = 'ya29.a0ATkoCc78Z89-Y8ZaonW-FTFFPYIdD8R6P_xAfH5OTvocwbVHIRumiwOnZbOLk0hcH0XmXu_dnGB3OPn_geTS002tziJt4-NQAodgDc1BL-uX9UrbuymyKZ56NL38U1Hp8BV3zWGQN8zJ7gVYft5uPyptNTU7GmmcZ9ARfZiZv-p0_7H6TuYyf7FJ3fTqGlUNiBscDi4aCgYKAToSARMSFQHGX2MiwuXwcUbts1rH0J-PE6NEEQ0206';

    oAuth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Try to list messages just to verify access
    console.log('Attempting to list messages...');
    const res = await gmail.users.messages.list({ userId: 'me', maxResults: 1 });
    console.log('Success! API access working with provided Access Token.');
    console.log('Message ID:', res.data.messages[0].id);

  } catch (error) {
    console.error('Access Token Test Failed:', error.message);
    if (error.response) {
        console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

run();
