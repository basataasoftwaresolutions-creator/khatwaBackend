const main = async () => {
  const base = (process.env.API_URL || 'http://localhost:5000/api/v1').replace(/\/$/, '');
  const email = 'logo_test_' + Date.now() + '@example.com';
  const password = 'password123';

  const readJson = async (res) => {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) return res.json();
    const text = await res.text();
    return { __nonJson: true, contentType: ct || null, text };
  };

  let res = await fetch(base + '/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Logo Test', email, password })
  });
  let json = await readJson(res);
  if (!res.ok) throw new Error('register ' + res.status + ' ' + JSON.stringify(json));

  const token = json.token;

  res = await fetch(base + '/projects', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'My Project', description: 'desc', industry: 'restaurants', stage: 'idea' })
  });
  json = await readJson(res);
  if (!res.ok) throw new Error('createProject ' + res.status + ' ' + JSON.stringify(json));

  const projectId = json.data.id;

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/az3N0wAAAAASUVORK5CYII=',
    'base64'
  );

  const fd = new FormData();
  fd.append('logo', new Blob([png], { type: 'image/png' }), 'logo.png');

  res = await fetch(base + '/projects/' + projectId + '/logo', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token },
    body: fd
  });
  json = await readJson(res);
  if (!res.ok) throw new Error('uploadLogo ' + res.status + ' ' + JSON.stringify(json));

  res = await fetch(base + '/projects/' + projectId, {
    headers: { Authorization: 'Bearer ' + token }
  });
  json = await readJson(res);
  if (!res.ok) throw new Error('getProject ' + res.status + ' ' + JSON.stringify(json));

  console.log('ok', { projectId, logoUrl: json.data.logoUrl });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
