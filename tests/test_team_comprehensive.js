const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20;

// Test Data
const ownerUser = {
    name: 'Team Owner',
    email: `team_owner_${Date.now()}@example.com`,
    password: 'password123'
};

const memberUser = {
    name: 'Team Member',
    email: `team_member_${Date.now()}@example.com`,
    password: 'password123'
};

const nonMemberUser = {
    name: 'Non Member',
    email: `non_member_${Date.now()}@example.com`,
    password: 'password123'
};

const testProject = {
    name: 'Team Project',
    description: 'Project for testing team management',
    stage: 'idea',
    onboardingData: {
        targetAudience: 'Everyone',
        problemStatement: 'Working alone is lonely',
        solution: 'Teams'
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
    console.log('Starting Comprehensive Team Tests (Strict Protocol)...\n');
    let ownerToken, memberToken, nonMemberToken;
    let projectId, memberId, nonMemberId;

    // 1. Setup
    console.log('--- Setup ---');
    
    // Register Owner
    const ownerRegRes = await post('/auth/register', ownerUser);
    ownerToken = ownerRegRes.data.token;
    
    // Register Member
    const memberRegRes = await post('/auth/register', memberUser);
    memberToken = memberRegRes.data.token;
    
    const memberMeRes = await get('/auth/me', memberToken);
    memberId = memberMeRes.data.data._id;

    // Register Non-Member
    const nonMemberRegRes = await post('/auth/register', nonMemberUser);
    nonMemberToken = nonMemberRegRes.data.token;
    
    const nonMemberMeRes = await get('/auth/me', nonMemberToken);
    nonMemberId = nonMemberMeRes.data.data._id;

    // Create Project
    const projectRes = await post('/projects', testProject, ownerToken);
    projectId = projectRes.data.data._id;
    console.log('✓ Users registered and Project created');

    console.log('');

    // 2. Functional Tests
    console.log('--- Functional Tests ---');

    // Add Member
    const addMemberRes = await post(`/projects/${projectId}/team`, { email: memberUser.email, role: 'editor' }, ownerToken);
    if (addMemberRes.status === 200) {
        console.log('✓ Add Member Passed');
    } else {
        console.error('✗ Add Member Failed:', addMemberRes.data);
    }

    // Get Members (Owner)
    const getMembersOwnerRes = await get(`/projects/${projectId}/team`, ownerToken);
    if (getMembersOwnerRes.status === 200 && getMembersOwnerRes.data.count >= 1) {
        console.log('✓ Get Members (Owner) Passed');
    } else {
        console.error('✗ Get Members (Owner) Failed:', getMembersOwnerRes.data);
    }

    // Get Members (Member)
    const getMembersMemberRes = await get(`/projects/${projectId}/team`, memberToken);
    if (getMembersMemberRes.status === 200) {
        console.log('✓ Get Members (Member) Passed');
    } else {
        console.error('✗ Get Members (Member) Failed:', getMembersMemberRes.data);
    }

    console.log('');

    // 3. Negative Tests
    console.log('--- Negative Tests ---');

    // Unauthorized Add (Non-Owner)
    const unauthorizedAddRes = await post(`/projects/${projectId}/team`, { email: nonMemberUser.email }, memberToken); // Member is editor, not admin
    if (unauthorizedAddRes.status === 403) {
        console.log('✓ Unauthorized Add Check Passed');
    } else {
        console.error('✗ Unauthorized Add Check Failed:', unauthorizedAddRes.status);
    }

    // Add Non-Existent User
    const notFoundUserRes = await post(`/projects/${projectId}/team`, { email: 'fake@email.com' }, ownerToken);
    if (notFoundUserRes.status === 404) {
        console.log('✓ User Not Found Check Passed');
    } else {
        console.error('✗ User Not Found Check Failed:', notFoundUserRes.status);
    }

    // Duplicate Member
    const duplicateMemberRes = await post(`/projects/${projectId}/team`, { email: memberUser.email }, ownerToken);
    if (duplicateMemberRes.status === 400) {
        console.log('✓ Duplicate Member Check Passed');
    } else {
        console.error('✗ Duplicate Member Check Failed:', duplicateMemberRes.status);
    }

    // Unauthorized Get Members (Non-Member)
    const unauthorizedGetRes = await get(`/projects/${projectId}/team`, nonMemberToken);
    if (unauthorizedGetRes.status === 403) {
        console.log('✓ Unauthorized Get Members Check Passed');
    } else {
        console.error('✗ Unauthorized Get Members Check Failed:', unauthorizedGetRes.status);
    }

    // 4. Cleanup/Remove Test
    // Remove Member
    const removeMemberRes = await del(`/projects/${projectId}/team/${memberId}`, ownerToken);
    if (removeMemberRes.status === 200) {
        console.log('✓ Remove Member Passed');
    } else {
        console.error('✗ Remove Member Failed:', removeMemberRes.data);
    }
    
    // Verify Removal
    const verifyRemovalRes = await get(`/projects/${projectId}/team`, ownerToken);
    const stillMember = verifyRemovalRes.data.data.find(m => m.user.id === memberId);
    if (!stillMember) {
        console.log('✓ Verification of Removal Passed');
    } else {
        console.error('✗ Verification of Removal Failed: User still in list');
    }

    console.log('');

    // 5. Performance Validation
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
                const res = await get(`/projects/${projectId}/team`, ownerToken);
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

    console.log('\n✓ All Team Tests Completed Successfully');
};

runTests();
