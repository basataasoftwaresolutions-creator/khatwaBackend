const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20;

// Test Data
const testUser = {
    name: 'Task Tester',
    email: `task_test_${Date.now()}@example.com`,
    password: 'password123'
};

const testProject = {
    name: 'Task Project',
    description: 'Project for testing tasks',
    stage: 'idea', // Updated to valid enum
    onboardingData: {
        targetAudience: 'Developers',
        problemStatement: 'Testing is hard',
        solution: 'Automated tests'
    }
};

// Utils
const post = async (endpoint, data, token) => {
    try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return await axios.post(`${API_URL}${endpoint}`, data, config);
    } catch (err) {
        return err.response || { status: 500, data: { message: err.message } };
    }
};

const get = async (endpoint, token) => {
    try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return await axios.get(`${API_URL}${endpoint}`, config);
    } catch (err) {
        return err.response || { status: 500, data: { message: err.message } };
    }
};

const put = async (endpoint, data, token) => {
    try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return await axios.put(`${API_URL}${endpoint}`, data, config);
    } catch (err) {
        return err.response || { status: 500, data: { message: err.message } };
    }
};

// Stats
let requestStats = {
    total: 0,
    success: 0,
    failed: 0,
    latencies: []
};

const recordStat = (success, duration) => {
    requestStats.total++;
    if (success) requestStats.success++;
    else requestStats.failed++;
    requestStats.latencies.push(duration);
};

const calculatePercentiles = () => {
    const sorted = requestStats.latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    return { p50, p95, p99 };
};

// Main Test Execution
const runTests = async () => {
    console.log('Starting Comprehensive Task Tests (Strict Protocol)...\n');
    let token, projectId, userId, taskId;

    // 1. Setup
    console.log('--- Setup ---');
    
    // Register User
    const registerRes = await post('/auth/register', testUser);
    if (registerRes.status === 201) {
        token = registerRes.data.token;
        console.log('✓ User registered');
    } else {
        console.error('✗ User registration failed:', registerRes.data);
        process.exit(1);
    }

    // Get User ID
    const meRes = await get('/auth/me', token);
    if (meRes.status === 200) {
        userId = meRes.data.data._id;
    } else {
        console.error('✗ Get me failed');
        process.exit(1);
    }

    // Create Project
    const projectRes = await post('/projects', testProject, token);
    if (projectRes.status === 201) {
        projectId = projectRes.data.data.id;
        console.log('✓ Project created');
    } else {
        console.error('✗ Project creation failed:', projectRes.data);
        process.exit(1);
    }

    console.log('');

    // 2. Functional Tests
    console.log('--- Functional Tests ---');

    // Create Task
    const taskData = {
        title: 'Implement Authentication',
        assignedTo: userId,
        dueDate: new Date(Date.now() + 86400000).toISOString() // +1 day
    };

    const createTaskRes = await post(`/projects/${projectId}/tasks`, taskData, token);
    if (createTaskRes.status === 201 && createTaskRes.data.data.title === taskData.title) {
        taskId = createTaskRes.data.data.id;
        console.log('✓ Create Task Passed');
    } else {
        console.error('✗ Create Task Failed:', createTaskRes.data);
    }

    // Get Tasks
    const getTasksRes = await get(`/projects/${projectId}/tasks`, token);
    if (getTasksRes.status === 200 && getTasksRes.data.count >= 1) {
        console.log('✓ Get Tasks Passed');
    } else {
        console.error('✗ Get Tasks Failed:', getTasksRes.data);
    }

    // Update Task Status
    const updateTaskRes = await put(`/tasks/${taskId}`, { status: 'in_progress' }, token);
    if (updateTaskRes.status === 200 && updateTaskRes.data.data.status === 'in_progress') {
        console.log('✓ Update Task Status Passed');
    } else {
        console.error('✗ Update Task Status Failed:', updateTaskRes.data);
    }

    console.log('');

    // 3. Negative Tests
    console.log('--- Negative Tests ---');

    // Unauthorized Access (New User)
    const unauthorizedUser = {
        name: 'Hacker',
        email: `hacker_${Date.now()}@example.com`,
        password: 'password123'
    };
    const hackerRegRes = await post('/auth/register', unauthorizedUser);
    const hackerToken = hackerRegRes.data.token;

    const accessCheckRes = await get(`/projects/${projectId}/tasks`, hackerToken);
    if (accessCheckRes.status === 403) {
        console.log('✓ Unauthorized Access Check Passed');
    } else {
        console.error('✗ Unauthorized Access Check Failed:', accessCheckRes.status);
    }

    // Invalid Project ID
    const invalidIdRes = await get('/projects/999999/tasks', token);
    if (invalidIdRes.status === 404) {
        console.log('✓ Invalid Project ID Check Passed');
    } else {
        console.error('✗ Invalid Project ID Check Failed:', invalidIdRes.status);
    }

    // 4. Performance Validation
    console.log('\n--- Performance Validation ---');
    
    // Reset stats to measure ONLY performance requests
    requestStats = {
        total: 0,
        success: 0,
        failed: 0,
        latencies: []
    };
    
    console.log(`Executing ${CONCURRENCY_LEVEL} concurrent requests...`);

    const promises = [];
    for (let i = 0; i < CONCURRENCY_LEVEL; i++) {
        promises.push(
            (async () => {
                const start = performance.now();
                const res = await get(`/projects/${projectId}/tasks`, token);
                const duration = performance.now() - start;
                recordStat(res.status === 200, duration);
            })()
        );
    }

    await Promise.all(promises);

    const metrics = calculatePercentiles();
    
    console.log(`Total Requests: ${requestStats.total}`);
    console.log(`Success Rate: ${((requestStats.success / requestStats.total) * 100).toFixed(2)}%`);
    console.log(`p50 Latency: ${metrics.p50.toFixed(2)}ms`);
    console.log(`p95 Latency: ${metrics.p95.toFixed(2)}ms`);
    console.log(`p99 Latency: ${metrics.p99.toFixed(2)}ms`);

    if (requestStats.success !== requestStats.total) {
        console.error('✗ Reliability Failed: Success rate < 100%');
        process.exit(1);
    }

    if (metrics.p95 > 200) {
        console.warn(`⚠ Performance Warning: p95 latency (${metrics.p95.toFixed(2)}ms) exceeds threshold (200ms)`);
    } else {
        console.log('✓ Performance Threshold Met');
    }

    console.log('\n✓ All Task Tests Completed Successfully');
};

runTests();
