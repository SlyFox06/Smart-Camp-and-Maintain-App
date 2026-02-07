import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import prisma from './src/db/prisma';

const createAdmin = async () => {
    try {
        console.log('Creating admin user...');

        // Delete existing admin if any
        await prisma.user.deleteMany({
            where: { email: 'admin@campus.edu' }
        });

        // Create new admin with correct password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = await prisma.user.create({
            data: {
                name: 'Admin User',
                email: 'admin@campus.edu',
                password: hashedPassword,
                role: 'admin',
                department: 'IT Department',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                isFirstLogin: false
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('   Email: admin@campus.edu');
        console.log('   Password: admin123');
        console.log(`   ID: ${admin.id}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
};

createAdmin();
