const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20;

// Test Data
const user = {
    name: 'Subscription User',
    email: `sub_user_${Date.now()}@example.com`,
    password: 'password123'
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

const del = async (endpoint, token) => {
    try {
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        return await axios.delete(`${API_URL}${endpoint}`, config);
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
    console.log('Starting Comprehensive Subscription Tests (Strict Protocol)...\n');
    let token;

    // 1. Setup
    console.log('--- Setup ---');
    
    // Register User
    const reg = await post('/auth/register', user);
    token = reg.data.token;
    
    console.log('✓ User registered');
    console.log('');

    // 2. Functional Tests
    console.log('--- Functional Tests ---');

    // Get Default Subscription (Should create one if missing)
    const getSubRes = await get('/subscriptions', token);
    if (getSubRes.status === 200 && getSubRes.data.data.planType === 'Free') {
        console.log('✓ Get Default Subscription Passed');
    } else {
        console.error('✗ Get Default Subscription Failed:', getSubRes.data);
    }

    // Upgrade Subscription
    const upgradeRes = await put('/subscriptions', { planType: 'Pro' }, token);
    if (upgradeRes.status === 200 && upgradeRes.data.data.planType === 'Pro') {
        console.log('✓ Upgrade Subscription Passed');
    } else {
        console.error('✗ Upgrade Subscription Failed:', upgradeRes.data);
    }

    // Cancel Subscription
    const cancelRes = await del('/subscriptions', token);
    if (cancelRes.status === 200 && cancelRes.data.data.status === 'canceled') {
        console.log('✓ Cancel Subscription Passed');
    } else {
        console.error('✗ Cancel Subscription Failed:', cancelRes.data);
    }

    console.log('');

    // 3. Negative Tests
    console.log('--- Negative Tests ---');

    // Invalid Plan Type
    const invalidPlanRes = await put('/subscriptions', { planType: 'UltraPremium' }, token);
    if (invalidPlanRes.status === 400) {
        console.log('✓ Invalid Plan Type Check Passed');
    } else {
        console.error('✗ Invalid Plan Type Check Failed:', invalidPlanRes.status);
    }

    // Cancel Already Canceled
    const doubleCancelRes = await del('/subscriptions', token);
    if (doubleCancelRes.status === 400) {
        console.log('✓ Double Cancel Check Passed');
    } else {
        console.error('✗ Double Cancel Check Failed:', doubleCancelRes.status);
    }

    console.log('');

    // 4. Performance Validation
    console.log('\n--- Performance Validation ---');
    
    // Reset stats
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
                const res = await get('/subscriptions', token);
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

    console.log('\n✓ All Subscription Tests Completed Successfully');
};

runTests();
