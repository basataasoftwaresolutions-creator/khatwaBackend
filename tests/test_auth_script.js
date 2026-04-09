const http = require('http');

const post = (path, data) => {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.write(dataString);
    req.end();
  });
};

const get = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
};

const run = async () => {
  try {
    const email = `test${Date.now()}@example.com`;
    
    console.log('--- HAPPY PATH ---');
    console.log(`1. Registering user: ${email}`);
    const regRes = await post('/api/v1/auth/register', {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    console.log('Register Response:', regRes.status, regRes.body.success);

    if (!regRes.body.success) {
      console.error('Registration failed');
      return;
    }

    console.log('2. Logging in user');
    const loginRes = await post('/api/v1/auth/login', {
      email: email,
      password: 'password123'
    });
    console.log('Login Response:', loginRes.status, loginRes.body.success);

    if (!loginRes.body.success) {
      console.error('Login failed');
      return;
    }

    const token = loginRes.body.token;

    console.log('3. Getting Profile (Me) using login token');
    const meRes = await get('/api/v1/auth/me', token);
    console.log('Me Response:', meRes.status, meRes.body.success);


    console.log('\n--- NEGATIVE TESTS (Validations) ---');
    
    // 4. Register with missing fields
    console.log('4. Testing Register with missing fields (should fail)');
    const failRegRes = await post('/api/v1/auth/register', {
        name: 'No Email User',
        password: 'password123'
    });
    console.log('Missing Email Response:', failRegRes.status, failRegRes.body);
    if(failRegRes.status === 400 && failRegRes.body.message.includes('Please add an email')) {
        console.log('PASS: Correctly rejected missing email');
    } else {
        console.log('FAIL: Unexpected response for missing email');
    }

    // 5. Register with duplicate email
    console.log('5. Testing Register with duplicate email (should fail)');
    const dupRegRes = await post('/api/v1/auth/register', {
        name: 'Duplicate User',
        email: email, // reusing existing email
        password: 'password123'
    });
    console.log('Duplicate Email Response:', dupRegRes.status, dupRegRes.body);
    if(dupRegRes.status === 400 && (dupRegRes.body.message.includes('Duplicate field value entered') || dupRegRes.body.message.includes('must be unique'))) {
        console.log('PASS: Correctly rejected duplicate email');
    } else {
        console.log('FAIL: Unexpected response for duplicate email');
    }

    // 6. Login with wrong password
    console.log('6. Testing Login with wrong password (should fail)');
    const failLoginRes = await post('/api/v1/auth/login', {
        email: email,
        password: 'wrongpassword'
    });
    console.log('Wrong Password Response:', failLoginRes.status, failLoginRes.body);
    if(failLoginRes.status === 401) {
        console.log('PASS: Correctly rejected wrong password');
    } else {
        console.log('FAIL: Unexpected response for wrong password');
    }

     // 7. Login with non-existent email
     console.log('7. Testing Login with non-existent email (should fail)');
     const noUserLoginRes = await post('/api/v1/auth/login', {
         email: 'doesntexist@example.com',
         password: 'password123'
     });
     console.log('Non-existent Email Response:', noUserLoginRes.status, noUserLoginRes.body);
     if(noUserLoginRes.status === 401) {
         console.log('PASS: Correctly rejected non-existent email');
     } else {
         console.log('FAIL: Unexpected response for non-existent email');
     }

  } catch (err) {
    console.error('Error:', err);
  }
};

run();
