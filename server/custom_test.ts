
import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const test = async () => {
    console.log('🧪 Testing Images Type...');

    try {
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@campus.edu',
            password: 'admin123'
        });
        const token = login.data.token;

        const res = await axios.get('http://localhost:5000/api/admin/complaints', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.length > 0) {
            const c = res.data[0];
            console.log('Images:', c.images);
            console.log('Type of images:', typeof c.images);
            console.log('Is Array?', Array.isArray(c.images));
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
};

test();
