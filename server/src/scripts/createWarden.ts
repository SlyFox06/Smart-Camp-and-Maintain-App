
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const createWarden = async () => {
    try {
        console.log('Connecting to database...');
        const email = 'warden@campus.edu';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('Checking for existing warden...');
        const existingWarden = await prisma.user.findUnique({
            where: { email: email }
        });

        if (existingWarden) {
            console.log(`Warden already exists: ${email}`);
            console.log(`Password: ${password}`);
        } else {
            console.log('Creating new warden...');
            const warden = await prisma.user.create({
                data: {
                    name: 'Hostel Warden',
                    email: email,
                    password: hashedPassword,
                    role: 'warden',
                    department: 'Hostel Administration',
                    accessScope: 'hostel',
                    isFirstLogin: false,
                    isActive: true
                }
            });
            console.log(`Warden created successfully:`);
            console.log(`Email: ${warden.email}`);
            console.log(`Password: ${password}`);
        }
    } catch (error) {
        console.error('Error creating warden:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    } finally {
        await prisma.$disconnect();
    }
};

createWarden();
