const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let token;
let projectId;

async function runTests() {
  try {
    console.log('--- Starting Task Tags Support Tests ---');

    // 1. Register/Login User
    console.log('1. Authenticating User...');
    const email = `task_tags_tester_${Date.now()}@example.com`;
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Task Tags Tester',
        email,
        password: 'password123'
      });
      token = registerRes.data.token;
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      return;
    }

    // 2. Create Project
    console.log('2. Creating Project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Tags Project',
      description: 'Testing task tags',
      type: 'business'
    }, { headers: { Authorization: `Bearer ${token}` } });
    projectId = projectRes.data.data.id;

    // 3. Create Task with Tags
    console.log('3. Creating Task with Tags...');
    const tags = ['Marketing', 'Design', 'Urgent'];
    const taskData = {
      title: 'Design Logo',
      description: 'Create a new logo for the project',
      priority: 'high',
      dueDate: new Date(),
      tags: tags
    };

    const taskRes = await axios.post(`${API_URL}/projects/${projectId}/tasks`, taskData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const createdTask = taskRes.data.data;
    console.log('Created Task:', JSON.stringify(createdTask, null, 2));

    // 4. Verify Tags
    if (!createdTask.tags || !Array.isArray(createdTask.tags)) {
      throw new Error('Tags field is missing or not an array');
    }

    const tagsMatch = JSON.stringify(createdTask.tags.sort()) === JSON.stringify(tags.sort());
    if (!tagsMatch) {
      throw new Error(`Tags do not match. Expected: ${JSON.stringify(tags)}, Got: ${JSON.stringify(createdTask.tags)}`);
    }

    console.log('Tags Verified Successfully!');
    console.log('--- All Tests Passed ---');

  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

runTests();
