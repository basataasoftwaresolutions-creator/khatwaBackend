const nodemailer = require('nodemailer');

async function test() {
  console.log('Testing Nodemailer with family: 4...');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    logger: true,
    debug: true,
    family: 4, // Force IPv4
    auth: {
        user: 'test',
        pass: 'test'
    }
  });

  try {
    // We expect this to fail authentication, but succeed in connection
    await transporter.verify();
  } catch (err) {
    // Check if the error is network related or auth related
    if (err.code === 'EAUTH') {
        console.log('\nSUCCESS: Connected to Gmail (IPv4 forced), but authentication failed as expected.');
    } else {
        console.log('\nFAILURE: Connection error:', err.message);
        console.log('Error Code:', err.code);
    }
  }
}

test();
