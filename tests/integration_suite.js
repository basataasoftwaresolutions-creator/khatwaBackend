const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function runTests() {
  let token;
  let projectId;
  let marketingPlanId;
  let taskId;
  let financialRecordId;
  let postId;

  console.log('--- Starting Comprehensive Integration Tests ---');

  try {
    // 1. Auth: Register
    console.log('\n[1. Auth] Registering user...');
    const email = `test_user_${Date.now()}@example.com`;
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Integration Tester',
      email: email,
      password: 'password123',
      role: 'owner'
    });
    token = registerRes.data.token;
    console.log('✅ Registered successfully.');

    // 2. Auth: Login (Verify credentials)
    console.log('\n[2. Auth] Logging in...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: email,
      password: 'password123'
    });
    if (!loginRes.data.token) throw new Error('Login failed');
    console.log('✅ Login successful.');

    // 3. Projects: Create
    console.log('\n[3. Projects] Creating project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Integration Project',
      description: 'Testing all modules',
      stage: 'operating',
      industry: 'Tech'
    }, { headers: { Authorization: `Bearer ${token}` } });
    projectId = projectRes.data.data.id;
    console.log(`✅ Project created (ID: ${projectId}).`);

    // 4. Projects: Get Dashboard
    console.log('\n[4. Projects] Fetching dashboard...');
    await axios.get(`${API_URL}/projects/${projectId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Dashboard fetched.');

    // 5. Finance: Add Record
    console.log('\n[5. Finance] Adding financial record...');
    const financeRes = await axios.post(`${API_URL}/projects/${projectId}/finance`, {
      type: 'revenue',
      amount: 5000,
      category: 'Sales',
      title: 'Initial Revenue',
      date: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${token}` } });
    financialRecordId = financeRes.data.data.id;
    console.log('✅ Financial record added.');

    // 6. Marketing: Create Plan
    console.log('\n[6. Marketing] Creating marketing plan...');
    const marketingRes = await axios.post(`${API_URL}/projects/${projectId}/marketing-plans`, {
      platform: 'instagram',
      type: 'post',
      title: 'Launch Post',
      content: 'Hello World',
      status: 'active'
    }, { headers: { Authorization: `Bearer ${token}` } });
    marketingPlanId = marketingRes.data.data.id;
    console.log('✅ Marketing plan created.');

    // 7. Tasks: Create Task
    console.log('\n[7. Tasks] Creating task...');
    const taskRes = await axios.post(`${API_URL}/projects/${projectId}/tasks`, {
      title: 'Setup Environment',
      status: 'todo',
      priority: 'high'
    }, { headers: { Authorization: `Bearer ${token}` } });
    taskId = taskRes.data.data.id;
    console.log('✅ Task created.');

    // 8. Team: Add Member (Invite)
    console.log('\n[8. Team] Inviting member...');
    // Create another user to invite
    const inviteeEmail = `invitee_${Date.now()}@example.com`;
    await axios.post(`${API_URL}/auth/register`, {
      name: 'Invited Member',
      email: inviteeEmail,
      password: 'password123'
    });
    
    await axios.post(`${API_URL}/projects/${projectId}/team/invite`, {
      email: inviteeEmail,
      role: 'editor'
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Member invited.');

    // 9. Community: Create Post
    console.log('\n[9. Community] Creating post...');
    const postRes = await axios.post(`${API_URL}/community/posts`, {
      title: 'Integration Test Post',
      content: 'Integration test post content',
      tags: ['test', 'integration']
    }, { headers: { Authorization: `Bearer ${token}` } });
    postId = postRes.data.data.id;
    console.log('✅ Community post created.');

    // 10. Reports: Create Report
    console.log('\n[10. Reports] Creating report...');
    await axios.post(`${API_URL}/projects/${projectId}/reports`, {
      type: 'overall',
      format: 'pdf',
      dateFrom: new Date().toISOString(),
      dateTo: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('✅ Report created.');

    // 11. Analytics: Get Dashboard
    console.log('\n[11. Analytics] Fetching analytics dashboard...');
    const analyticsRes = await axios.get(`${API_URL}/analytics/${projectId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const analytics = analyticsRes.data.data;
    if (analytics.tasks.total !== 1 || analytics.finance.revenue !== 5000 || analytics.marketing.totalCampaigns !== 1) {
      throw new Error(`Analytics mismatch: ${JSON.stringify(analytics)}`);
    }
    console.log('✅ Analytics dashboard verified.');

    // Cleanup (Optional - Delete Project)
    console.log('\n[Cleanup] Deleting project...');
    await axios.delete(`${API_URL}/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Project deleted.');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
}

runTests();
