import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const testLogin = async () => {
    console.log('🧪 Testing Database Connection...\n');

    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@campus.edu',
            password: 'admin123'
        });

        console.log('✅ Database Connected Successfully!');
        console.log('✅ Login Successful!');
        console.log('\nUser Details:');
        console.log('  Name:', response.data.user.name);
        console.log('  Email:', response.data.user.email);
        console.log('  Role:', response.data.user.role);
        console.log('  Department:', response.data.user.department);
        console.log('\n🎉 Everything is working! You can now login to the website.');

    } catch (error: any) {
        console.error('❌ Database Connection Failed!');
        if (error.response) {
            console.error('Error:', error.response.data.message);
            console.error('Status:', error.response.status);
        } else {
            console.error('Error:', error.message);
        }
        console.error('\n💡 Make sure you ran the SQL schema in Supabase.');
    }
};

testLogin();
