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

// Helper to calculate percentiles
function calculatePercentiles() {
    const sorted = requestStats.latencies.sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.50)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    
    return { p50, p95, p99 };
}

async function runTests() {
    console.log('Starting Comprehensive Finance Tests (Strict Protocol)...');
    
    const uniqueSuffix = Date.now();
    const email = `fin_user_${uniqueSuffix}@example.com`;
    const password = 'password123';
    let token = '';
    let projectId = '';
    let secondToken = '';

    // 1. Setup: Register User
    console.log('\n--- Setup ---');
    const registerRes = await post('/auth/register', {
        name: 'Finance Tester',
        email,
        password
    });
    
    if (registerRes.status === 201 || registerRes.status === 200) {
        token = registerRes.body.token;
        console.log('✓ User registered');
    } else {
        console.error('✗ Registration failed:', registerRes.body);
        process.exit(1);
    }

    // 2. Setup: Create Project
    const projectRes = await post('/projects', {
        name: `Fin Project ${uniqueSuffix}`,
        description: 'Finance Testing',
        stage: 'idea',
        onboardingData: { industry: 'tech', teamSize: '1-5' }
    }, token);

    if (projectRes.status === 201) {
        projectId = projectRes.body.data.id;
        console.log('✓ Project created');
    } else {
        console.error('✗ Project creation failed:', projectRes.body);
        process.exit(1);
    }

    // 3. Functional Tests
    console.log('\n--- Functional Tests ---');

    // Add Revenue
    const revRes = await post(`/projects/${projectId}/finance`, {
        type: 'revenue',
        amount: 5000,
        category: 'Sales',
        date: new Date().toISOString()
    }, token);
    
    if (revRes.status === 201) {
        console.log('✓ Add Revenue Record Passed');
    } else {
        console.error('✗ Add Revenue Record Failed:', revRes.body);
    }

    // Add Expense
    const expRes = await post(`/projects/${projectId}/finance`, {
        type: 'expense',
        amount: 2000,
        category: 'Server Costs',
        date: new Date().toISOString()
    }, token);

    if (expRes.status === 201) {
        console.log('✓ Add Expense Record Passed');
    } else {
        console.error('✗ Add Expense Record Failed:', expRes.body);
    }

    // Get Records
    const getRes = await get(`/projects/${projectId}/finance`, token);
    if (getRes.status === 200 && getRes.body.count === 2) {
        console.log('✓ Get Records Passed');
    } else {
        console.error('✗ Get Records Failed:', getRes.body);
    }

    // Get Summary
    const summaryRes = await get(`/projects/${projectId}/finance/summary`, token);
    if (summaryRes.status === 200 && 
        summaryRes.body.data.revenue === 5000 && 
        summaryRes.body.data.expense === 2000 && 
        summaryRes.body.data.netProfit === 3000) {
        console.log('✓ Get Summary Passed');
    } else {
        console.error('✗ Get Summary Failed:', summaryRes.body);
    }

    // 4. Negative Tests
    console.log('\n--- Negative Tests ---');

    // Unauthorized Access (New User)
    const registerRes2 = await post('/auth/register', {
        name: 'Attacker',
        email: `attacker_${uniqueSuffix}@example.com`,
        password
    });
    secondToken = registerRes2.body.token;

    const unauthRes = await post(`/projects/${projectId}/finance`, {
        type: 'revenue',
        amount: 1000,
        category: 'Hacked',
        date: new Date().toISOString()
    }, secondToken);

    if (unauthRes.status === 403) {
        console.log('✓ Unauthorized Access Check Passed');
    } else {
        console.error('✗ Unauthorized Access Check Failed:', unauthRes.status);
    }

    // Invalid Project ID
    const invalidIdRes = await get('/projects/123456789012345678901234/finance', token);
    if (invalidIdRes.status === 404) {
        console.log('✓ Invalid Project ID Check Passed');
    } else {
        console.error('✗ Invalid Project ID Check Failed:', invalidIdRes.status);
    }

    // 5. Performance Validation
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
        promises.push(get(`/projects/${projectId}/finance`, token));
    }

    await Promise.all(promises);

    const metrics = calculatePercentiles();
    console.log(`Total Requests: ${requestStats.total}`);
    console.log(`Success Rate: ${((requestStats.success / requestStats.total) * 100).toFixed(2)}%`);
    console.log(`p50 Latency: ${metrics.p50.toFixed(2)}ms`);
    console.log(`p95 Latency: ${metrics.p95.toFixed(2)}ms`);
    console.log(`p99 Latency: ${metrics.p99.toFixed(2)}ms`);

    if (metrics.p95 > PERFORMANCE_THRESHOLD_MS) {
        console.warn(`⚠ Performance Warning: p95 latency (${metrics.p95.toFixed(2)}ms) exceeds threshold (${PERFORMANCE_THRESHOLD_MS}ms)`);
    } else {
        console.log('✓ Performance Check Passed');
    }
}

runTests().catch(console.error);
