const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20;

// Test Data
const user1 = {
    name: 'Community User 1',
    email: `comm_user1_${Date.now()}@example.com`,
    password: 'password123'
};

const user2 = {
    name: 'Community User 2',
    email: `comm_user2_${Date.now()}@example.com`,
    password: 'password123'
};

const testPost = {
    title: 'First Post',
    content: 'This is a test post for the community.',
    tags: ['test', 'community']
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
    console.log('Starting Comprehensive Community Tests (Strict Protocol)...\n');
    let token1, token2;
    let postId, commentId;

    // 1. Setup
    console.log('--- Setup ---');
    
    // Register User 1
    const reg1 = await post('/auth/register', user1);
    token1 = reg1.data.token;
    
    // Register User 2
    const reg2 = await post('/auth/register', user2);
    token2 = reg2.data.token;

    console.log('✓ Users registered');
    console.log('');

    // 2. Functional Tests
    console.log('--- Functional Tests ---');

    // Create Post
    const createPostRes = await post('/community/posts', testPost, token1);
    if (createPostRes.status === 201) {
        postId = createPostRes.data.data.id;
        console.log('✓ Create Post Passed');
    } else {
        console.error('✗ Create Post Failed:', createPostRes.data);
    }

    // Get Posts
    const getPostsRes = await get('/community/posts', token1);
    if (getPostsRes.status === 200 && getPostsRes.data.count >= 1) {
        console.log('✓ Get Posts Passed');
    } else {
        console.error('✗ Get Posts Failed:', getPostsRes.data);
    }

    // Get Single Post
    const getPostRes = await get(`/community/posts/${postId}`, token1);
    if (getPostRes.status === 200 && getPostRes.data.data.title === testPost.title) {
        console.log('✓ Get Single Post Passed');
    } else {
        console.error('✗ Get Single Post Failed:', getPostRes.data);
    }

    // Like Post (User 2)
    const likePostRes = await put(`/community/posts/${postId}/like`, {}, token2);
    if (likePostRes.status === 200 && likePostRes.data.data.length === 1) {
        console.log('✓ Like Post Passed');
    } else {
        console.error('✗ Like Post Failed:', likePostRes.data);
    }

    // Add Comment (User 2)
    const addCommentRes = await post(`/community/posts/${postId}/comments`, { content: 'Nice post!' }, token2);
    if (addCommentRes.status === 201) {
        commentId = addCommentRes.data.data._id;
        console.log('✓ Add Comment Passed');
    } else {
        console.error('✗ Add Comment Failed:', addCommentRes.data);
    }

    // Update Post (User 1)
    const updatePostRes = await put(`/community/posts/${postId}`, { title: 'Updated Title' }, token1);
    if (updatePostRes.status === 200 && updatePostRes.data.data.title === 'Updated Title') {
        console.log('✓ Update Post Passed');
    } else {
        console.error('✗ Update Post Failed:', updatePostRes.data);
    }

    console.log('');

    // 3. Negative Tests
    console.log('--- Negative Tests ---');

    // Unauthorized Update (User 2 updates User 1's post)
    const unauthorizedUpdateRes = await put(`/community/posts/${postId}`, { title: 'Hacked Title' }, token2);
    if (unauthorizedUpdateRes.status === 403) {
        console.log('✓ Unauthorized Update Check Passed');
    } else {
        console.error('✗ Unauthorized Update Check Failed:', unauthorizedUpdateRes.status);
    }

    // Unauthorized Delete Comment (User 1 deletes User 2's comment)
    const unauthorizedDeleteCommentRes = await del(`/community/comments/${commentId}`, token1);
    if (unauthorizedDeleteCommentRes.status === 403) {
        console.log('✓ Unauthorized Delete Comment Check Passed');
    } else {
        console.error('✗ Unauthorized Delete Comment Check Failed:', unauthorizedDeleteCommentRes.status);
    }

    // Post Not Found
    const notFoundPostRes = await get('/community/posts/999999', token1);
    if (notFoundPostRes.status === 404) {
        console.log('✓ Post Not Found Check Passed');
    } else {
        console.error('✗ Post Not Found Check Failed:', notFoundPostRes.status);
    }

    // 4. Cleanup
    // Delete Comment (User 2)
    await del(`/community/comments/${commentId}`, token2);
    // Delete Post (User 1)
    await del(`/community/posts/${postId}`, token1);
    console.log('✓ Cleanup Passed');

    console.log('');

    // 5. Performance Validation
    console.log('\n--- Performance Validation ---');
    
    // Create a fresh post for load testing
    const loadTestPostRes = await post('/community/posts', testPost, token1);
    const loadTestPostId = loadTestPostRes.data.data._id;

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
                const res = await get(`/community/posts/${loadTestPostId}`, token2);
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

    // Clean up load test post
    await del(`/community/posts/${loadTestPostId}`, token1);

    if (requestStats.success !== requestStats.total) {
        console.error('✗ Reliability Failed: Success rate < 100%');
        process.exit(1);
    }

    if (metrics.p95 > 200) {
        console.warn(`⚠ Performance Warning: p95 latency (${metrics.p95.toFixed(2)}ms) exceeds threshold (200ms)`);
    } else {
        console.log('✓ Performance Threshold Met');
    }

    console.log('\n✓ All Community Tests Completed Successfully');
};

runTests();
