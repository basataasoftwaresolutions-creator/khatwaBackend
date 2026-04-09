const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 20; 
const PERFORMANCE_THRESHOLD_MS = 200;

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
    console.log('Starting Comprehensive Marketing Plan Tests (Strict Protocol)...');
    
    const uniqueSuffix = Date.now();
    const email = `mkt_user_${uniqueSuffix}@example.com`;
    const password = 'password123';
    let token = '';
    let projectId = '';
    let planId = '';
    let secondToken = '';

    // --- PHASE 1: SETUP & FUNCTIONAL TESTS ---
    console.log('\n=== PHASE 1: SETUP & FUNCTIONAL TESTS ===');

    try {
        // Setup Users
        const regRes = await post('/auth/register', { name: 'Mkt Owner', email, password });
        token = regRes.body.token;
        
        const regRes2 = await post('/auth/register', { name: 'Mkt Hacker', email: `hacker_${uniqueSuffix}@example.com`, password });
        secondToken = regRes2.body.token;

        // Create Project
        const createProj = await post('/projects', { name: 'Mkt Project', description: 'Test', industry: 'Tech' }, token);
        projectId = createProj.body.data._id;
        console.log('Setup: Project Created');

        // 1. Create Marketing Plan (Happy Path)
        console.log('1. Create Marketing Plan (Happy Path)');
        const createRes = await post(`/projects/${projectId}/marketing-plans`, {
            objectives: ['Increase Brand Awareness'],
            channels: ['Social Media', 'SEO'],
            budget: 5000
        }, token);
        
        if (createRes.status === 201) {
            console.log('PASS: Plan created');
            planId = createRes.body.data._id;
        } else {
            console.error('FAIL: Create plan failed', createRes.body);
            process.exit(1);
        }

        // 2. Get Active Plan
        console.log('2. Get Active Plan (Happy Path)');
        const getRes = await get(`/projects/${projectId}/marketing-plans`, token);
        if (getRes.status === 200 && getRes.body.data.budget === 5000) {
            console.log('PASS: Get plan successful');
        } else {
            console.error('FAIL: Get plan failed', getRes.status);
        }

        // 3. Update Plan
        console.log('3. Update Plan (Happy Path)');
        const updateRes = await put(`/marketing-plans/${planId}`, {
            budget: 10000,
            contentStrategy: 'Weekly Blog Posts'
        }, token);
        if (updateRes.status === 200 && updateRes.body.data.budget === 10000) {
            console.log('PASS: Update successful');
        } else {
            console.error('FAIL: Update failed', updateRes.status);
        }

        // --- NEGATIVE TESTS ---
        console.log('\n--- Negative Scenarios ---');

        // 4. Duplicate Plan
        console.log('4. Create Duplicate Active Plan (400)');
        const dupRes = await post(`/projects/${projectId}/marketing-plans`, { objectives: ['New'] }, token);
        if (dupRes.status === 400) {
            console.log('PASS: Duplicate active plan rejected');
        } else {
            console.error('FAIL: Duplicate plan allowed', dupRes.status);
        }

        // 5. Unauthorized Creation
        console.log('5. Create Plan for Non-Owned Project (403)');
        const failCreate = await post(`/projects/${projectId}/marketing-plans`, { objectives: ['Hacked'] }, secondToken);
        if (failCreate.status === 403) {
            console.log('PASS: Unauthorized creation rejected');
        } else {
            console.error('FAIL: Unauthorized creation allowed', failCreate.status);
        }

        // 6. Unauthorized Get
        console.log('6. Get Plan for Non-Owned Project (403)');
        const failGet = await get(`/projects/${projectId}/marketing-plans`, secondToken);
        if (failGet.status === 403) {
            console.log('PASS: Unauthorized read rejected');
        } else {
            console.error('FAIL: Unauthorized read allowed', failGet.status);
        }

        // 7. Update Non-Existent
        console.log('7. Update Non-Existent Plan (404)');
        const fakeId = 999999;
        const failUpdate = await put(`/marketing-plans/${fakeId}`, { budget: 999 }, token);
        if (failUpdate.status === 404) {
            console.log('PASS: Non-existent update rejected');
        } else {
            console.error('FAIL: Non-existent update allowed', failUpdate.status);
        }

    } catch (e) {
        console.error('Phase 1 Error:', e);
    }

    // --- PHASE 2: PERFORMANCE TESTS ---
    console.log('\n=== PHASE 2: PERFORMANCE & LOAD TESTS ===');
    console.log(`Simulating ${CONCURRENCY_LEVEL} concurrent GET plan requests...`);

    // Reset stats
    requestStats = { total: 0, success: 0, failed: 0, latencies: [] };

    const promises = [];
    for (let i = 0; i < CONCURRENCY_LEVEL; i++) {
        promises.push(get(`/projects/${projectId}/marketing-plans`, token));
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
