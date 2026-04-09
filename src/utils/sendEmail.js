const { google } = require('googleapis');
const { Resend } = require('resend');

// Determine which service to use based on environment variables
// Priority: 
// 1. Gmail API (GMAIL_CLIENT_ID present) - Bypasses SMTP ports, no domain verification needed
// 2. Resend (RESEND_API_KEY present) - HTTP-based, requires domain verification for non-account emails
// 3. Mailtrap (Default fallback) - For development/sandbox

const sendEmail = async (options) => {
  // Option 1: Gmail REST API (Recommended for production without custom domain)
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN) {
    return sendViaGmailApi(options);
  }

  // Option 2: Resend API (Recommended if you have a verified domain)
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(options);
  }

  // Option 3: Mailtrap (Development fallback)
  console.warn('[sendEmail] No API keys found for Gmail or Resend. Falling back to Mailtrap (simulated).');
  // ... (Mailtrap implementation or error)
  throw new Error('No email service configured. Please set GMAIL_* or RESEND_API_KEY variables.');
};

/**
 * Sends email using Gmail REST API (googleapis)
 * Bypasses SMTP ports (uses HTTP port 443)
 */
const sendViaGmailApi = async (options) => {
  try {
    console.log(`[sendEmail] Sending via Gmail API to ${options.email}...`);
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Construct the raw email message
    // RFC 2822 standard format
    const subject = options.subject;
    const to = options.email;
    const body = options.message;
    // Note: 'from' is determined by the authenticated user's Gmail account
    // We can try to set it, but Gmail overrides it with the authenticated user
    const from = process.env.SMTP_EMAIL || 'me'; 

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${utf8Subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      body
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log('[sendEmail] Gmail API Success:', res.data.id);
    return res.data;
  } catch (error) {
    console.error('[sendEmail] Gmail API Error:', error.message);
    throw new Error(`Gmail API Error: ${error.message}`);
  }
};

/**
 * Sends email using Resend API
 */
const sendViaResend = async (options) => {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromName = process.env.FROM_NAME || 'Khatwa Support';
    // Use the verified domain or the onboarding domain
    // If user hasn't verified a domain, they can only send to their own email via onboarding@resend.dev
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const from = `${fromName} <${fromEmail}>`;

    console.log(`[sendEmail] Sending via Resend to ${options.email}...`);

    const { data, error } = await resend.emails.send({
      from: from,
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    if (error) {
      console.error('[sendEmail] Resend Error:', error);
      throw new Error(error.message);
    }

    console.log('[sendEmail] Resend Success:', data.id);
    return data;
  } catch (err) {
    console.error('[sendEmail] Resend Exception:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
