const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let token;
let projectId;

async function runTests() {
  try {
    console.log('--- Starting Dashboard Analytics Tests ---');

    // 1. Register/Login User
    console.log('1. Authenticating User...');
    const email = `analytics_tester_${Date.now()}@example.com`;
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Analytics Tester',
        email,
        password: 'password123'
      });
      token = registerRes.data.token;
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      return;
    }

    // 2. Create Project
    console.log('2. Creating Project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Analytics Project',
      description: 'Testing analytics widgets',
      type: 'business'
    }, { headers: { Authorization: `Bearer ${token}` } });
    projectId = projectRes.data.data.id;

    // 3. Seed Data (Tasks & Finance)
    console.log('3. Seeding Data...');
    
    // Dates
    const now = new Date();
    
    // Add Task
    await axios.post(`${API_URL}/projects/${projectId}/tasks`, { title: 'Task 1', priority: 'high', dueDate: now }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Add Finance Record (Revenue)
    await axios.post(`${API_URL}/projects/${projectId}/finance`, { type: 'revenue', amount: 1000, description: 'Rev 1', date: now }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Add Finance Record (Expense)
    await axios.post(`${API_URL}/projects/${projectId}/finance`, { type: 'expense', amount: 500, description: 'Exp 1', date: now }, { headers: { Authorization: `Bearer ${token}` } });

    // 4. Get Dashboard Stats
    console.log('4. Fetching Dashboard Stats...');
    const dashboardRes = await axios.get(`${API_URL}/projects/${projectId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const widgets = dashboardRes.data.data.widgets;
    console.log('Widgets:', JSON.stringify(widgets, null, 2));

    if (!widgets.growthRate || !widgets.monthlyExpenses || !widgets.taskCompletion || !widgets.totalRevenue) {
      throw new Error('Missing widgets in response');
    }

    const charts = dashboardRes.data.data.charts;
    if (!charts || !charts.weeklyTasks || !charts.monthlyPerformance || !charts.growthTrends || !charts.revenueForecast) {
      throw new Error('Missing charts in response');
    }

    if (!Array.isArray(charts.weeklyTasks) || charts.weeklyTasks.length !== 4) {
      throw new Error('Invalid weeklyTasks chart data');
    }

    if (!Array.isArray(charts.monthlyPerformance) || charts.monthlyPerformance.length !== 6) {
      throw new Error('Invalid monthlyPerformance chart data');
    }

    if (!Array.isArray(charts.growthTrends) || charts.growthTrends.length !== 4) {
      throw new Error('Invalid growthTrends chart data');
    }

    if (!Array.isArray(charts.revenueForecast) || charts.revenueForecast.length !== 12) {
      throw new Error('Invalid revenueForecast chart data');
    }

    // New Key Indicators Check
    const keyIndicators = dashboardRes.data.data.keyIndicators;
    if (!keyIndicators) {
      throw new Error('Missing keyIndicators in response');
    }
    console.log('Key Indicators:', JSON.stringify(keyIndicators, null, 2));
    
    if (typeof keyIndicators.highestMonthlyRevenue !== 'number' || typeof keyIndicators.bestWeekAchievement !== 'number') {
      throw new Error('Invalid keyIndicators types');
    }

    // New Insights Check
    const insights = dashboardRes.data.data.insights;
    if (!Array.isArray(insights)) {
      throw new Error('Insights should be an array');
    }
    if (insights.length > 0) {
      console.log('First Insight:', JSON.stringify(insights[0], null, 2));
      if (!insights[0].title || !insights[0].type || !insights[0].confidence) {
        throw new Error('Invalid insight structure');
      }
    } else {
      console.warn('Warning: No insights generated (might be expected depending on data)');
    }

    console.log('Charts & Indicators Structure Verified.');
    console.log('--- All Tests Passed ---');

  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

runTests();
