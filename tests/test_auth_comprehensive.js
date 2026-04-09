const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000/api/v1';
const CONCURRENCY_LEVEL = 50; // Requests to fire in parallel for load test
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
                
                // Record stats
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
    console.log('Starting Comprehensive Auth Tests (Strict Protocol)...');
    
    const uniqueSuffix = Date.now();
    const email = `test_comp_${uniqueSuffix}@example.com`;
    const password = 'password123';
    let token = '';

    // --- PHASE 1: FUNCTIONAL & NEGATIVE TESTS ---
    console.log('\n=== PHASE 1: FUNCTIONAL & NEGATIVE TESTS ===');

    try {
        // 1. Happy Path Register
        console.log('1. Register User (Happy Path)');
        const regRes = await post('/auth/register', { name: 'Comp Test', email, password });
        if (regRes.status === 201) {
            console.log('PASS: Registration successful');
            token = regRes.body.token;
        } else {
            console.error('FAIL: Registration failed', regRes.body);
            process.exit(1);
        }

        // 2. Happy Path Login
        console.log('2. Login User (Happy Path)');
        const loginRes = await post('/auth/login', { email, password });
        if (loginRes.status === 200 && loginRes.body.token) {
            console.log('PASS: Login successful');
            token = loginRes.body.token; // Update token just in case
        } else {
            console.error('FAIL: Login failed', loginRes.body);
        }

        // 3. Get Me
        console.log('3. Get Me (Happy Path)');
        const meRes = await get('/auth/me', token);
        if (meRes.status === 200 && meRes.body.data.email === email) {
            console.log('PASS: Profile retrieval successful');
        } else {
            console.error('FAIL: Profile retrieval failed', meRes.body);
        }

        // --- NEGATIVE TESTS ---
        console.log('\n--- Negative Scenarios ---');

        // 4. Register - Duplicate Email
        console.log('4. Register Duplicate Email (400/500)');
        const dupRes = await post('/auth/register', { name: 'Dup User', email, password });
        if (dupRes.status >= 400) {
            console.log('PASS: Duplicate rejected');
        } else {
            console.error('FAIL: Duplicate allowed', dupRes.status);
        }

        // 5. Register - Missing Fields
        console.log('5. Register Missing Email (400/500)');
        const missingRes = await post('/auth/register', { name: 'No Email', password });
        if (missingRes.status >= 400) {
            console.log('PASS: Missing field rejected');
        } else {
            console.error('FAIL: Missing field allowed', missingRes.status);
        }

        // 6. Login - Wrong Password
        console.log('6. Login Wrong Password (401)');
        const wrongPassRes = await post('/auth/login', { email, password: 'wrong' });
        if (wrongPassRes.status === 401) {
            console.log('PASS: Wrong password rejected');
        } else {
            console.error('FAIL: Wrong password allowed', wrongPassRes.status);
        }

        // 7. Login - Non-existent User
        console.log('7. Login Non-existent User (401)');
        const noUserRes = await post('/auth/login', { email: 'ghost@example.com', password });
        if (noUserRes.status === 401) {
            console.log('PASS: Non-existent user rejected');
        } else {
            console.error('FAIL: Non-existent user allowed', noUserRes.status);
        }

        // 8. Auth - Malformed Token
        console.log('8. Access Protected Route with Malformed Token (401)');
        const malformedRes = await get('/auth/me', 'invalid_token_string');
        if (malformedRes.status === 401) {
            console.log('PASS: Malformed token rejected');
        } else {
            console.error('FAIL: Malformed token allowed', malformedRes.status);
        }

        // 9. Auth - No Token
        console.log('9. Access Protected Route without Token (401)');
        const noTokenRes = await get('/auth/me', null);
        if (noTokenRes.status === 401) {
            console.log('PASS: No token rejected');
        } else {
            console.error('FAIL: No token allowed', noTokenRes.status);
        }

    } catch (e) {
        console.error('Phase 1 Error:', e);
    }

    // --- PHASE 2: PERFORMANCE TESTS ---
    console.log('\n=== PHASE 2: PERFORMANCE & LOAD TESTS ===');
    console.log(`Simulating ${CONCURRENCY_LEVEL} concurrent login requests...`);

    // Reset stats for clean performance measurement
    requestStats = { total: 0, success: 0, failed: 0, latencies: [] };

    const promises = [];
    for (let i = 0; i < CONCURRENCY_LEVEL; i++) {
        promises.push(post('/auth/login', { email, password }));
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
        
        // Validation against baseline
        if (metrics.p95 < PERFORMANCE_THRESHOLD_MS) {
            console.log(`PASS: Performance within limits (p95 < ${PERFORMANCE_THRESHOLD_MS}ms)`);
        } else {
            console.warn(`WARN: Performance degraded (p95 > ${PERFORMANCE_THRESHOLD_MS}ms)`);
        }

        if (requestStats.failed > 0) {
            console.warn(`WARN: ${requestStats.failed} requests failed during load test`);
        } else {
            console.log('PASS: Zero failures under load');
        }

    } catch (e) {
        console.error('Phase 2 Error:', e);
    }
}

runTests();
