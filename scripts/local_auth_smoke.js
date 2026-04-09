const axios = require('axios');

const main = async () => {
  const base = 'http://localhost:5000/api/v1';
  const email = `local_test_${Date.now()}@example.com`;
  const password = 'password123';

  const registerRes = await axios.post(`${base}/auth/register`, {
    name: 'Local Test',
    email,
    password
  });

  console.log('register', registerRes.status, Boolean(registerRes.data && registerRes.data.token));

  const loginRes = await axios.post(`${base}/auth/login`, { email, password });
  console.log('login', loginRes.status, Boolean(loginRes.data && loginRes.data.token));

  const token = loginRes.data.token;
  const meRes = await axios.get(`${base}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log('me', meRes.status, meRes.data && meRes.data.data && meRes.data.data.email);
};

main().catch((e) => {
  console.error('error', e.response && e.response.status, e.response && e.response.data ? e.response.data : e.message);
  process.exit(1);
});

