const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let ownerToken;
let ownerId;
let projectId;
let memberEmail;

async function runTests() {
  try {
    console.log('--- Starting Team Features & Task Status Tests ---');

    // 1. Register Owner
    console.log('1. Authenticating Owner...');
    const ownerEmail = `owner_${Date.now()}@example.com`;
    const ownerRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Owner User',
      email: ownerEmail,
      password: 'password123'
    });
    ownerToken = ownerRes.data.token;
    ownerId = ownerRes.data.data.id; // Assuming response structure

    // 2. Create Project
    console.log('2. Creating Project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Team Project',
      description: 'Testing team features',
      type: 'business'
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });
    projectId = projectRes.data.data.id;

    // 3. Register a User to be added as Member
    console.log('3. Registering Potential Member...');
    memberEmail = `member_${Date.now()}@example.com`;
    const memberRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Member User',
      email: memberEmail,
      password: 'password123'
    });
    const memberId = memberRes.data.data ? memberRes.data.data.id : null; // Need ID for task assignment if needed

    // 4. Add Member with Job Title
    console.log('4. Adding Member with Job Title...');
    const addMemberRes = await axios.post(`${API_URL}/projects/${projectId}/team`, {
      email: memberEmail,
      role: 'editor',
      jobTitle: 'Senior Developer'
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });
    
    // Verify Job Title in response (it returns list of members)
    const members = addMemberRes.data.data;
    const addedMember = members.find(m => m.user.email === memberEmail);
    
    if (!addedMember) {
        throw new Error('Member not found in response after adding');
    }
    
    if (addedMember.jobTitle !== 'Senior Developer') {
        throw new Error(`Job Title mismatch. Expected: 'Senior Developer', Got: '${addedMember.jobTitle}'`);
    }
    console.log('Member added with Job Title successfully.');

    // 5. Create Task with 'review' status and assign to member
    console.log('5. Creating Task with "review" status...');
    const taskRes = await axios.post(`${API_URL}/projects/${projectId}/tasks`, {
      title: 'Code Review',
      status: 'review',
      priority: 'high',
      dueDate: new Date(),
      assignedTo: addedMember.userId // Use the userId from team member record
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });

    const task = taskRes.data.data;
    if (task.status !== 'review') {
        throw new Error(`Task status mismatch. Expected: 'review', Got: '${task.status}'`);
    }
    console.log('Task created with "review" status successfully.');

    // 6. Verify Team List returns Task Count
    console.log('6. Verifying Team List Task Count...');
    const teamRes = await axios.get(`${API_URL}/projects/${projectId}/team`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    
    const teamMembers = teamRes.data.data;
    const targetMember = teamMembers.find(m => m.user.email === memberEmail);
    
    console.log('Member Stats:', JSON.stringify(targetMember, null, 2));

    if (targetMember.assignedTaskCount !== 1) {
        throw new Error(`Task count mismatch. Expected: 1, Got: ${targetMember.assignedTaskCount}`);
    }

    // 7. Update Member Job Title
    console.log('7. Updating Member Job Title...');
    await axios.put(`${API_URL}/projects/${projectId}/team/${targetMember.userId}`, {
        jobTitle: 'Lead Developer'
    }, { headers: { Authorization: `Bearer ${ownerToken}` } });
    
    // Verify Update
    const updatedTeamRes = await axios.get(`${API_URL}/projects/${projectId}/team`, {
        headers: { Authorization: `Bearer ${ownerToken}` }
    });
    const updatedMember = updatedTeamRes.data.data.find(m => m.user.email === memberEmail);
    
    if (updatedMember.jobTitle !== 'Lead Developer') {
        throw new Error(`Job Title update failed. Expected: 'Lead Developer', Got: '${updatedMember.jobTitle}'`);
    }

    console.log('Job Title updated successfully.');
    console.log('--- All Tests Passed ---');

  } catch (err) {
    const errorMessage = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    console.error('Test Failed:', errorMessage);
  }
}

runTests();
