import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@campus.edu',
            password: 'password123'
        });
        console.log('✅ Login successful:', response.data.user.name);
    } catch (error: any) {
        console.error('❌ Login failed:', error.response?.status, error.response?.data);
    }
}

testLogin();
