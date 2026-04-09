const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:5000/api/v1';
let TOKEN = '';
let SECOND_TOKEN = '';
let PROJECT_ID = '';

// Helper function to make HTTP requests
function request(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
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
                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: data
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

// Wrapper functions
const post = (path, body, token) => request('POST', path, body, token);
const get = (path, token) => request('GET', path, null, token);
const put = (path, body, token) => request('PUT', path, body, token);
const del = (path, token) => request('DELETE', path, null, token);

async function runTests() {
    console.log('Starting Project CRUD Tests...');

    try {
        // 1. Setup: Register a user to get a token
        console.log('\n--- SETUP: AUTH ---');
        const uniqueSuffix = Date.now();
        const userCredentials = {
            name: `Project Tester ${uniqueSuffix}`,
            email: `project_tester_${uniqueSuffix}@example.com`,
            password: 'password123'
        };

        const registerRes = await post('/auth/register', userCredentials);
        if (registerRes.status === 201) {
            TOKEN = registerRes.body.token;
            console.log('User registered and authenticated. Token received.');
        } else {
            console.error('Failed to register user:', registerRes.body);
            process.exit(1);
        }

        // Setup second user for ownership tests
        const secondUserCredentials = {
            name: `Second User ${uniqueSuffix}`,
            email: `second_user_${uniqueSuffix}@example.com`,
            password: 'password123'
        };
        const secondRegisterRes = await post('/auth/register', secondUserCredentials);
        if (secondRegisterRes.status === 201) {
            SECOND_TOKEN = secondRegisterRes.body.token;
            console.log('Second user registered and authenticated.');
        } else {
            console.error('Failed to register second user:', secondRegisterRes.body);
        }

        // 2. Create Project
        console.log('\n--- TEST: CREATE PROJECT ---');
        const newProject = {
            name: `Test Project ${uniqueSuffix}`,
            description: 'A project for testing CRUD operations',
            industry: 'Tech',
            stage: 'idea'
        };

        const createRes = await post('/projects', newProject, TOKEN);
        console.log('Create Response Status:', createRes.status);
        if (createRes.status === 201) {
            console.log('PASS: Project created successfully');
            PROJECT_ID = createRes.body.data.id;
            console.log('Project ID:', PROJECT_ID);
        } else {
            console.error('FAIL: Failed to create project', createRes.body);
        }

        // 3. Get All Projects
        console.log('\n--- TEST: GET ALL PROJECTS ---');
        const getAllRes = await get('/projects', TOKEN);
        console.log('Get All Response Status:', getAllRes.status);
        if (getAllRes.status === 200 && Array.isArray(getAllRes.body.data)) {
            console.log(`PASS: Retrieved ${getAllRes.body.count} projects`);
            const found = getAllRes.body.data.find(p => p.id === PROJECT_ID);
            if (found) console.log('PASS: Created project found in list');
            else console.error('FAIL: Created project NOT found in list');
        } else {
            console.error('FAIL: Failed to get projects', getAllRes.body);
        }

        // 4. Get Single Project
        console.log('\n--- TEST: GET SINGLE PROJECT ---');
        const getOneRes = await get(`/projects/${PROJECT_ID}`, TOKEN);
        console.log('Get One Response Status:', getOneRes.status);
        if (getOneRes.status === 200 && getOneRes.body.data.id === PROJECT_ID) {
            console.log('PASS: Retrieved single project details');
        } else {
            console.error('FAIL: Failed to get single project', getOneRes.body);
        }

        // 5. Update Project
        console.log('\n--- TEST: UPDATE PROJECT ---');
        const updateData = {
            name: `Updated Project ${uniqueSuffix}`,
            stage: 'operating'
        };
        const updateRes = await put(`/projects/${PROJECT_ID}`, updateData, TOKEN);
        console.log('Update Response Status:', updateRes.status);
        if (updateRes.status === 200 && updateRes.body.data.name === updateData.name) {
            console.log('PASS: Project updated successfully');
        } else {
            console.error('FAIL: Failed to update project', updateRes.body);
        }

        // --- EXTENDED NEGATIVE TESTS ---
        console.log('\n--- EXTENDED NEGATIVE TESTS ---');

        // 6. Auth Check: Create without token
        console.log('\n6. Testing Create without token (should fail 401)');
        const noTokenRes = await post('/projects', newProject, null);
        if (noTokenRes.status === 401) {
            console.log('PASS: Correctly rejected unauthenticated request');
        } else {
            console.log('FAIL: Unexpected status:', noTokenRes.status);
        }

        // 7. Ownership Check: Update project by another user
        console.log('\n7. Testing Update by non-owner (should fail 401)');
        const unauthorizedUpdateRes = await put(`/projects/${PROJECT_ID}`, { name: 'Hacked Name' }, SECOND_TOKEN);
        if (unauthorizedUpdateRes.status === 401) {
            console.log('PASS: Correctly rejected update from non-owner');
        } else {
            console.log('FAIL: Unexpected status (allowed non-owner update):', unauthorizedUpdateRes.status);
        }

        // 8. Ownership Check: Delete project by another user
        console.log('\n8. Testing Delete by non-owner (should fail 401)');
        const unauthorizedDeleteRes = await del(`/projects/${PROJECT_ID}`, SECOND_TOKEN);
        if (unauthorizedDeleteRes.status === 401) {
            console.log('PASS: Correctly rejected delete from non-owner');
        } else {
            console.log('FAIL: Unexpected status (allowed non-owner delete):', unauthorizedDeleteRes.status);
        }

        // 9. Not Found Check: Get non-existent project
        console.log('\n9. Testing Get non-existent project (should fail 404)');
        // Use a valid fake ObjectId
        const fakeId = 999999;
        const notFoundRes = await get(`/projects/${fakeId}`, TOKEN);
        if (notFoundRes.status === 404) {
            console.log('PASS: Correctly returned 404 for non-existent ID');
        } else {
            console.log('FAIL: Unexpected status:', notFoundRes.status);
        }

        // 10. Validation Check: Invalid Enum
        console.log('\n10. Testing Invalid Enum Value (should fail 500/400)');
        const invalidEnumProject = {
            name: 'Invalid Stage Project',
            stage: 'unicorn_mode' // Invalid stage
        };
        const invalidEnumRes = await post('/projects', invalidEnumProject, TOKEN);
        // Mongoose validation error is currently 500 in our global handler
        if (invalidEnumRes.status === 500 || invalidEnumRes.status === 400) {
            console.log('PASS: Correctly rejected invalid enum value');
        } else {
            console.log('FAIL: Unexpected status for invalid enum:', invalidEnumRes.status);
        }

        // 11. Validation Check: Missing Required Fields
        console.log('\n11. Testing Missing Required Name (should fail 500/400)');
        const missingNameProject = {
            description: 'No name provided'
        };
        const failCreateRes = await post('/projects', missingNameProject, TOKEN);
        if (failCreateRes.status === 500 || failCreateRes.status === 400) {
            console.log('PASS: Correctly rejected project with missing name');
        } else {
            console.log('WARN: Unexpected status for missing field:', failCreateRes.status);
        }

        // 12. Delete Project (Cleanup)
        console.log('\n--- CLEANUP: DELETE PROJECT ---');
        const deleteRes = await del(`/projects/${PROJECT_ID}`, TOKEN);
        console.log('Delete Response Status:', deleteRes.status);
        if (deleteRes.status === 200) {
            console.log('PASS: Project deleted successfully');
        } else {
            console.error('FAIL: Failed to delete project', deleteRes.body);
        }

        // 13. Verify Deletion
        console.log('\n--- VERIFY CLEANUP ---');
        const verifyRes = await get(`/projects/${PROJECT_ID}`, TOKEN);
        if (verifyRes.status === 404) {
            console.log('PASS: Project correctly returns 404 after deletion');
        } else {
            console.error('FAIL: Project still exists or wrong error code', verifyRes.status);
        }

    } catch (error) {
        console.error('Test script error:', error);
    }
}

runTests();
