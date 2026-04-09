const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let token;
let projectId;

async function runTests() {
  try {
    console.log('--- Starting Finance Features Tests ---');

    // 1. Register Owner
    console.log('1. Authenticating Owner...');
    const email = `finance_owner_${Date.now()}@example.com`;
    const authRes = await axios.post(`${API_URL}/auth/register`, {
      name: 'Finance Owner',
      email: email,
      password: 'password123'
    });
    token = authRes.data.token;

    // 2. Create Project
    console.log('2. Creating Project...');
    const projectRes = await axios.post(`${API_URL}/projects`, {
      name: 'Finance Project',
      description: 'Testing finance features',
      type: 'business'
    }, { headers: { Authorization: `Bearer ${token}` } });
    projectId = projectRes.data.data.id;

    // 3. Add Financial Records
    console.log('3. Adding Financial Records...');
    
    // Revenue 1: 5000 SAR - Sales
    await axios.post(`${API_URL}/projects/${projectId}/finance`, {
      type: 'revenue',
      amount: 5000,
      category: 'Sales',
      title: 'Q1 Sales Title',
      description: 'Q1 Sales Description',
      date: new Date()
    }, { headers: { Authorization: `Bearer ${token}` } });

    // Revenue 2: 2000 SAR - Consulting
    await axios.post(`${API_URL}/projects/${projectId}/finance`, {
      type: 'revenue',
      amount: 2000,
      category: 'Consulting',
      title: 'Consulting Fee Title',
      description: 'Consulting Fee Description',
      date: new Date()
    }, { headers: { Authorization: `Bearer ${token}` } });

    // Expense 1: 1500 SAR - Marketing
    await axios.post(`${API_URL}/projects/${projectId}/finance`, {
      type: 'expense',
      amount: 1500,
      category: 'Marketing',
      title: 'Ads Title',
      description: 'Ads Description',
      date: new Date()
    }, { headers: { Authorization: `Bearer ${token}` } });

    // Expense 2: 500 SAR - Software
    await axios.post(`${API_URL}/projects/${projectId}/finance`, {
      type: 'expense',
      amount: 500,
      category: 'Software',
      title: 'Hosting Title',
      description: 'Hosting Description',
      date: new Date()
    }, { headers: { Authorization: `Bearer ${token}` } });

    console.log('Records added successfully.');

    // 4. Verify Financial Summary
    console.log('4. Verifying Financial Summary...');
    const summaryRes = await axios.get(`${API_URL}/projects/${projectId}/finance/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Verify Summary Structure & Values
    const summary = summaryRes.data.data;
    console.log('Summary:', summary);

    if (summary.totalRevenue !== 7000) throw new Error(`Expected revenue 7000, got ${summary.totalRevenue}`);
    if (summary.totalExpenses !== 2000) throw new Error(`Expected expense 2000, got ${summary.totalExpenses}`);
    if (summary.profit !== 5000) throw new Error(`Expected netProfit 5000, got ${summary.profit}`);
    if (summary.profitMargin !== 71.4) throw new Error(`Expected profitMargin 71.4, got ${summary.profitMargin}`);
    if (summary.currency !== 'SAR') throw new Error(`Expected currency SAR, got ${summary.currency}`);

    // Verify Trends
    if (!summary.trends) throw new Error('Trends object missing');
    if (summary.trends.revenue.amount !== 7000) throw new Error(`Expected trend revenue 7000, got ${summary.trends.revenue.amount}`);

    console.log('Financial Summary Verified.');

    // 5. Verify Chart Data
    console.log('5. Verifying Chart Data...');
    const chartRes = await axios.get(`${API_URL}/projects/${projectId}/finance/chart-data`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const chartData = chartRes.data.data;
    console.log('Chart Data Keys:', Object.keys(chartData));

    if (!chartData.expensesByCategory || !Array.isArray(chartData.expensesByCategory)) {
        throw new Error('expensesByCategory missing or not an array');
    }
    if (!chartData.monthlyTrend || !Array.isArray(chartData.monthlyTrend)) {
        throw new Error('monthlyTrend missing or not an array');
    }

    // Verify Expense Categories
    const marketingExpense = chartData.expensesByCategory.find(e => e.category === 'Marketing');
    if (!marketingExpense || marketingExpense.amount !== 1500) {
        throw new Error('Marketing expense category mismatch in chart data');
    }

    console.log('Chart Data Verified.');

    // 6. Verify Recent Transactions
    console.log('6. Verifying Recent Transactions...');
    const transRes = await axios.get(`${API_URL}/projects/${projectId}/finance/transactions`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transactions = transRes.data.data;
    if (!Array.isArray(transactions) || transactions.length !== 4) {
        throw new Error(`Transactions count mismatch. Expected 4, got ${transactions.length}`);
    }

    // Verify sort order (DESC date/id) - implicitly by checking the first one (should be last added)
    // Since dates are identical (all now), it might depend on ID.
    // The last added was Expense 2 (500 SAR) with title 'Hosting Title'.
    const firstTransaction = transactions[0];
    if (firstTransaction.title !== 'Hosting Title') {
        throw new Error(`Transaction title mismatch. Expected 'Hosting Title', got '${firstTransaction.title}'`);
    }

    console.log('Recent Transactions Verified.');

    // 7. Update Record
    console.log('7. Updating Record...');
    const recordToUpdate = transactions[0]; // Hosting Title (500)
    await axios.put(`${API_URL}/projects/${projectId}/finance/${recordToUpdate.id}`, {
      amount: 600,
      title: 'Updated Hosting Title'
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // Verify Update
    const updatedRecordRes = await axios.get(`${API_URL}/projects/${projectId}/finance`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const updatedRecord = updatedRecordRes.data.data.find(r => r.id === recordToUpdate.id);
    if (parseFloat(updatedRecord.amount) !== 600) throw new Error('Update amount failed');
    if (updatedRecord.title !== 'Updated Hosting Title') throw new Error('Update title failed');
    console.log('Update Verified.');

    // 8. Delete Record
    console.log('8. Deleting Record...');
    await axios.delete(`${API_URL}/projects/${projectId}/finance/${recordToUpdate.id}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    
    // Verify Deletion
    const finalRecordsRes = await axios.get(`${API_URL}/projects/${projectId}/finance`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (finalRecordsRes.data.data.find(r => r.id === recordToUpdate.id)) {
        throw new Error('Deletion failed, record still exists');
    }
    console.log('Deletion Verified.');

    // 9. Verify Dashboard Overview
    console.log('9. Verifying Dashboard Overview...');
    const dashRes = await axios.get(`${API_URL}/projects/${projectId}/finance-dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!dashRes.data.data.summary || !dashRes.data.data.recentTransactions) {
        throw new Error('Dashboard overview structure mismatch');
    }
    console.log('Dashboard Overview Verified.');

    console.log('--- All Finance Tests Passed ---');

  } catch (err) {
    const errorMessage = err.response && err.response.data ? JSON.stringify(err.response.data) : err.message;
    console.error('Test Failed:', errorMessage);
    process.exit(1);
  }
}

runTests();
