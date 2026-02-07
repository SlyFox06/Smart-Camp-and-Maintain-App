import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const testDashboard = async () => {
    console.log('🧪 Testing Admin Dashboard & Analytics...\n');

    try {
        // Step 1: Login
        console.log('Step 1: Logging in...');
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@campus.edu',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful!');

        // Step 2: Get Analytics Data (New Endpoint)
        console.log('Step 2: Fetching /api/admin/analytics...');
        const analyticsResponse = await axios.get('http://localhost:5000/api/admin/analytics', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Analytics loaded successfully!');
        console.log('   Total Complaints:', analyticsResponse.data.totalComplaints);
        console.log('   By Status:', JSON.stringify(analyticsResponse.data.complaintsByStatus));

        // Step 3: Get Complaints List (New Endpoint)
        console.log('Step 3: Fetching /api/admin/complaints...');
        const complaintsResponse = await axios.get('http://localhost:5000/api/admin/complaints', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`✅ Complaints list loaded! Found ${complaintsResponse.data.length} complaints.`);

        console.log('\n🎉 System is fully functional!');

    } catch (error: any) {
        console.error('❌ Test failed!');
        if (error.response) {
            console.error('   Error:', error.response.data.message || error.response.statusText);
            console.error('   Status:', error.response.status);
            console.error('   Endpoint:', error.config.url);
        } else {
            console.error('   Error:', error.message);
        }
    }
};

testDashboard();
