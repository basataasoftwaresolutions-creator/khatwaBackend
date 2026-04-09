const https = require('https');

const BASE_URL = 'https://khatwabackend-production.up.railway.app';
const ORIGIN = 'http://localhost:4200';

const request = (method, path, headers = {}, body = null) =>
  new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const req = https.request(
      url,
      {
        method,
        headers: {
          Origin: ORIGIN,
          ...headers
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          })
        );
      }
    );

    req.on('error', (e) =>
      resolve({
        status: 0,
        headers: {},
        body: e.message
      })
    );

    if (body) req.write(body);
    req.end();
  });

const main = async () => {
  const health = await request('GET', '/');
  console.log('GET /', health.status, String(health.body || '').slice(0, 120));

  const preflight = await request('OPTIONS', '/api/v1/auth/register', {
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type'
  });
  console.log('OPTIONS /api/v1/auth/register', preflight.status);
  console.log('  acao', preflight.headers['access-control-allow-origin']);
  console.log('  acah', preflight.headers['access-control-allow-headers']);
  console.log('  acam', preflight.headers['access-control-allow-methods']);

  const email = `trae_test_${Date.now()}@example.com`;
  const payload = JSON.stringify({
    name: 'Trae Test',
    email,
    password: 'password123',
    role: 'user'
  });

  const register = await request(
    'POST',
    '/api/v1/auth/register',
    {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    payload
  );

  console.log('POST /api/v1/auth/register', register.status);
  console.log('  email', email);
  console.log('  acao', register.headers['access-control-allow-origin']);
  console.log('  body', String(register.body || '').slice(0, 400));
};

main();

