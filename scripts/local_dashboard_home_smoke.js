const axios = require('axios');

const main = async () => {
  const base = 'http://localhost:5000/api/v1';
  const email = `dash_home_${Date.now()}@example.com`;
  const password = 'password123';

  const registerRes = await axios.post(`${base}/auth/register`, {
    name: 'Dash Home',
    email,
    password
  });

  const token = registerRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  const projectRes = await axios.post(
    `${base}/projects`,
    { name: 'Home Project', description: 'Created for dashboard smoke' },
    { headers: authHeaders }
  );

  const projectId = projectRes.data.data.id;

  await axios.post(
    `${base}/projects/${projectId}/tasks`,
    { title: 'Task 1', status: 'todo', priority: 'medium' },
    { headers: authHeaders }
  );

  await axios.post(
    `${base}/projects/${projectId}/tasks`,
    { title: 'Task 2', status: 'done', priority: 'high' },
    { headers: authHeaders }
  );

  await axios.post(
    `${base}/projects/${projectId}/finance`,
    { type: 'revenue', amount: 1000, category: 'Sales', date: new Date().toISOString(), title: 'Sale' },
    { headers: authHeaders }
  );

  await axios.post(
    `${base}/projects/${projectId}/finance`,
    { type: 'expense', amount: 250, category: 'Marketing', date: new Date().toISOString(), title: 'Ads' },
    { headers: authHeaders }
  );

  const projectsListRes = await axios.get(`${base}/projects`, { headers: authHeaders });
  console.log('projects', projectsListRes.status, Array.isArray(projectsListRes.data.data) ? projectsListRes.data.data.length : null);

  const tasksRes = await axios.get(`${base}/projects/${projectId}/tasks`, { headers: authHeaders });
  console.log('tasks', tasksRes.status, Array.isArray(tasksRes.data.data) ? tasksRes.data.data.length : null);

  const financeSummaryRes = await axios.get(`${base}/projects/${projectId}/finance/summary`, { headers: authHeaders });
  console.log('financeSummary', financeSummaryRes.status, {
    revenue: financeSummaryRes.data.data.revenue,
    expense: financeSummaryRes.data.data.expense,
    netProfit: financeSummaryRes.data.data.netProfit
  });
};

main().catch((e) => {
  console.error('error', e.response && e.response.status, e.response && e.response.data ? e.response.data : e.message);
  process.exit(1);
});

