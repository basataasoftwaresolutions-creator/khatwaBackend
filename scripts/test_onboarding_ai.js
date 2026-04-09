const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:5000/api/v1';
const TEST_USER = {
  email: `test_onboarding_${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User'
};

async function testOnboardingAI() {
  try {
    console.log('🚀 Starting Smart Onboarding AI Test...');

    // 1. Register
    console.log('\n1️⃣  Registering new user...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, TEST_USER);
    const token = registerRes.data.token;
    console.log('✅ User registered. Token received.');

    // 2. Create Project
    console.log('\n2️⃣  Creating new project...');
    const projectRes = await axios.post(
      `${API_URL}/projects`,
      {
        name: 'My AI Startup',
        description: 'A startup focused on AI solutions'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const projectId = projectRes.data.data.id;
    console.log(`✅ Project created. ID: ${projectId}`);

    // 3. Call Onboarding Analysis Endpoint
    console.log('\n3️⃣  Calling AI Onboarding Analysis (This may take a few seconds)...');
    
    // Data simulating the onboarding screens (from user screenshots)
    const onboardingData = {
      projectId: projectId,
      stage: 'idea',                  // Screen 1: "I have just an idea"
      primaryGoal: 'Increase Sales',  // Screen 2: "Increase Sales"
      industry: 'E-commerce',         // Screen 3: "E-commerce"
      teamSize: 'Small Team (2-5)',   // Screen 4: "Small Team"
      goals: ['Increase Revenue', 'Improve Efficiency'] // Screen 5: "Increase Revenue", "Improve Efficiency"
    };

    const aiRes = await axios.post(
      `${API_URL}/ai/onboarding-analysis`,
      onboardingData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ AI Analysis Received!');
    
    // 4. Display Results
    const result = aiRes.data.data;
    console.log('\n🧠 --- AI Response (Arabic) --- 🧠\n');
    
    console.log('📋 Strategy (استراتيجية):');
    console.log(result.strategy);
    console.log('\n🗺️  Roadmap (خارطة الطريق):');
    result.roadmap.forEach((step, index) => {
      console.log(`${index + 1}. ${step.step}: ${step.description}`);
    });
    
    console.log('\n💡 Solutions (الحلول):');
    result.solutions.forEach((sol, index) => {
      console.log(`${index + 1}. Challenge: ${sol.challenge}`);
      console.log(`   Advice: ${sol.advice}`);
    });

  } catch (error) {
    console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
  }
}

testOnboardingAI();
