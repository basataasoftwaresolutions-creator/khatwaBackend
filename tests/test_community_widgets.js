const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';
let token;
let user;

async function runTests() {
  try {
    console.log('--- Starting Community Widgets Tests ---');

    // 1. Register/Login User
    console.log('1. Authenticating User...');
    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        name: 'Widget Tester',
        email: `widget_tester_${Date.now()}@example.com`,
        password: 'password123'
      });
      token = registerRes.data.token;
      user = registerRes.data.user;
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      return;
    }
    console.log('   User authenticated:', user ? user.id : 'undefined');

    // 2. Create Posts
    console.log('2. Creating Posts...');
    const post1 = await axios.post(`${API_URL}/community/posts`, {
      title: 'Popular Post',
      content: 'This post should have many likes.',
      tags: ['popular']
    }, { headers: { Authorization: `Bearer ${token}` } });

    // Wait 1.5 seconds to ensure distinct timestamps for sorting tests
    await new Promise(resolve => setTimeout(resolve, 1500));

    const post2 = await axios.post(`${API_URL}/community/posts`, {
      title: 'Newest Post',
      content: 'This is the most recent post.',
      tags: ['new']
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    // 3. Add Likes to Post 1
    console.log('3. Liking Post 1...');
    await axios.put(`${API_URL}/community/posts/${post1.data.data.id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });

    // 4. Add Comments to Post 1
    console.log('4. Commenting on Post 1...');
    await axios.post(`${API_URL}/community/posts/${post1.data.data.id}/comments`, { content: 'Comment 1' }, { headers: { Authorization: `Bearer ${token}` } });
    await axios.post(`${API_URL}/community/posts/${post1.data.data.id}/comments`, { content: 'Comment 2' }, { headers: { Authorization: `Bearer ${token}` } });

    // 5. Test Filter: Popular
    console.log('5. Testing Filter: Popular...');
    const popularRes = await axios.get(`${API_URL}/community/posts?filter=popular`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const firstPopular = popularRes.data.data[0];
    if (firstPopular.id !== post1.data.data.id) throw new Error('Popular filter failed: Most liked post not first');
    console.log('   Popular filter passed.');

    // 6. Test Filter: Newest
    console.log('6. Testing Filter: Newest...');
    const newestRes = await axios.get(`${API_URL}/community/posts?filter=newest`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const firstNewest = newestRes.data.data[0];
    // Note: If tests run too fast, timestamps might be same. But post2 was created last.
    if (firstNewest.id !== post2.data.data.id) throw new Error('Newest filter failed: Most recent post not first');
    console.log('   Newest filter passed.');

    // 7. Test Filter: Mine
    console.log('7. Testing Filter: Mine...');
    const mineRes = await axios.get(`${API_URL}/community/posts?filter=mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const allMine = mineRes.data.data.every(p => p.authorId === user.id);
    if (!allMine) throw new Error('Mine filter failed: Found posts not by me');
    console.log('   Mine filter passed.');

    // 8. Test Fields: commentsCount and jobTitle
    console.log('8. Testing Fields...');
    const postCheck = popularRes.data.data.find(p => p.id === post1.data.data.id);
    console.log(`   Post has ${postCheck.commentsCount} comments (Expected 2)`);
    if (Number(postCheck.commentsCount) !== 2) throw new Error('commentsCount incorrect');
    
    console.log(`   Author jobTitle: ${postCheck.author.jobTitle}`); 
    // It will be null initially, but field should exist in response
    
    console.log('--- All Tests Passed ---');

  } catch (err) {
    console.error('Test Failed:', err.response?.data || err.message);
  }
}

runTests();
