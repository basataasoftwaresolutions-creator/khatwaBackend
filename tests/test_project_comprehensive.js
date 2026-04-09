const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20; // Concurrent requests for load test
const PERFORMANCE_THRESHOLD_MS = 200; // p95 should be under 200ms

// Stats Collection
let requestStats = {
    total: 0,
    success: 0,
    failed: 0,
    latencies: []
};

// Helper function to make HTTP requests and measure latency
function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const start = process.hrtime();
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: `/api/v1${path}`,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const diff = process.hrtime(start);
                const latencyMs = (diff[0] * 1000) + (diff[1] / 1e6);
                
                // Record stats for GET requests only (typical load) or all? Let's do all.
                requestStats.total++;
                requestStats.latencies.push(latencyMs);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    requestStats.success++;
                } else {
                    requestStats.failed++;
                }

                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(data),
                        latency: latencyMs
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: data,
                        latency: latencyMs
                    });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

const post = (path, body, token) => request('POST', path, body, token);
const get = (path, token) => request('GET', path, null, token);
const put = (path, body, token) => request('PUT', path, body, token);
const del = (path, token) => request('DELETE', path, null, token);

// Helper to calculate percentiles
function calculatePercentiles() {
    const sorted = requestStats.latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    
    return { p50, p95, p99 };
}

async function runTests() {
    console.log('Starting Comprehensive Project Tests (Strict Protocol)...');
    
    const uniqueSuffix = Date.now();
    const email = `proj_comp_${uniqueSuffix}@example.com`;
    const password = 'password123';
    let token = '';
    let projectId = '';
    let secondToken = '';

    // --- PHASE 1: SETUP & FUNCTIONAL TESTS ---
    console.log('\n=== PHASE 1: SETUP & FUNCTIONAL TESTS ===');

    try {
        // Setup Users
        const regRes = await post('/auth/register', { name: 'Proj Owner', email, password });
        token = regRes.body.token;
        
        const regRes2 = await post('/auth/register', { name: 'Proj Hacker', email: `hacker_${uniqueSuffix}@example.com`, password });
        secondToken = regRes2.body.token;

        // 1. Create Project (Happy)
        console.log('1. Create Project (Happy Path)');
        const createRes = await post('/projects', {
            name: 'Alpha Project',
            description: 'Test Description',
            industry: 'Tech'
        }, token);
        
        if (createRes.status === 201) {
            console.log('PASS: Project created');
            projectId = createRes.body.data._id;
        } else {
            console.error('FAIL: Create project failed', createRes.body);
            process.exit(1);
        }

        // 2. Get All Projects
        console.log('2. Get All Projects (Happy Path)');
        const getAllRes = await get('/projects', token);
        if (getAllRes.status === 200 && getAllRes.body.count >= 1) {
            console.log('PASS: Get all projects successful');
        } else {
            console.error('FAIL: Get all failed', getAllRes.status);
        }

        // 3. Get Single Project
        console.log('3. Get Single Project (Happy Path)');
        const getOneRes = await get(`/projects/${projectId}`, token);
        if (getOneRes.status === 200 && getOneRes.body.data.name === 'Alpha Project') {
            console.log('PASS: Get one project successful');
        } else {
            console.error('FAIL: Get one failed', getOneRes.status);
        }

        // 4. Update Project
        console.log('4. Update Project (Happy Path)');
        const updateRes = await put(`/projects/${projectId}`, { name: 'Alpha Project Updated' }, token);
        if (updateRes.status === 200 && updateRes.body.data.name === 'Alpha Project Updated') {
            console.log('PASS: Update successful');
        } else {
            console.error('FAIL: Update failed', updateRes.status);
        }

        // --- NEGATIVE TESTS ---
        console.log('\n--- Negative Scenarios ---');

        // 5. Create - Missing Fields
        console.log('5. Create Missing Fields (400)');
        const failCreate = await post('/projects', { description: 'No Name' }, token);
        if (failCreate.status === 400) {
            console.log('PASS: Missing field rejected');
        } else {
            console.error('FAIL: Missing field allowed', failCreate.status);
        }

        // 6. Update - Unauthorized User
        console.log('6. Update by Non-Owner (401/404)'); // Note: logic might return 404 if it checks owner in query
        const failUpdate = await put(`/projects/${projectId}`, { name: 'Hacked' }, secondToken);
        if (failUpdate.status === 401 || failUpdate.status === 403 || failUpdate.status === 404) {
            console.log(`PASS: Unauthorized update rejected (${failUpdate.status})`);
        } else {
            console.error('FAIL: Unauthorized update allowed', failUpdate.status);
        }

        // 7. Delete - Unauthorized User
        console.log('7. Delete by Non-Owner (401/404)');
        const failDelete = await del(`/projects/${projectId}`, secondToken);
        if (failDelete.status === 401 || failDelete.status === 403 || failDelete.status === 404) {
            console.log(`PASS: Unauthorized delete rejected (${failDelete.status})`);
        } else {
            console.error('FAIL: Unauthorized delete allowed', failDelete.status);
        }

        // 8. Get Non-Existent
        console.log('8. Get Non-Existent Project (404)');
        const fakeId = 999999; // Valid ID but random
        const notFoundRes = await get(`/projects/${fakeId}`, token);
        if (notFoundRes.status === 404) {
            console.log('PASS: Non-existent rejected (404)');
        } else {
            console.error('FAIL: Non-existent found?', notFoundRes.status);
        }

        // 9. Delete Project (Happy Path - Cleanup)
        console.log('9. Delete Project (Happy Path)');
        const delRes = await del(`/projects/${projectId}`, token);
        if (delRes.status === 200) {
            console.log('PASS: Delete successful');
        } else {
            console.error('FAIL: Delete failed', delRes.status);
        }

    } catch (e) {
        console.error('Phase 1 Error:', e);
    }

    // --- PHASE 2: PERFORMANCE TESTS ---
    console.log('\n=== PHASE 2: PERFORMANCE & LOAD TESTS ===');
    console.log(`Simulating ${CONCURRENCY_LEVEL} concurrent GET /projects requests...`);

    // Reset stats
    requestStats = { total: 0, success: 0, failed: 0, latencies: [] };

    const promises = [];
    for (let i = 0; i < CONCURRENCY_LEVEL; i++) {
        promises.push(get('/projects', token));
    }

    try {
        await Promise.all(promises);
        
        const metrics = calculatePercentiles();
        
        console.log('\n--- Performance Metrics ---');
        console.log(`Total Requests: ${requestStats.total}`);
        console.log(`Success Rate: ${((requestStats.success / requestStats.total) * 100).toFixed(2)}%`);
        console.log(`p50 Latency: ${metrics.p50.toFixed(2)}ms`);
        console.log(`p95 Latency: ${metrics.p95.toFixed(2)}ms`);
        console.log(`p99 Latency: ${metrics.p99.toFixed(2)}ms`);
        
        // Validation
        if (metrics.p95 < PERFORMANCE_THRESHOLD_MS) {
            console.log(`PASS: Performance within limits (p95 < ${PERFORMANCE_THRESHOLD_MS}ms)`);
        } else {
            console.warn(`WARN: Performance degraded (p95 > ${PERFORMANCE_THRESHOLD_MS}ms)`);
        }

    } catch (e) {
        console.error('Phase 2 Error:', e);
    }
}

runTests();
