import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'; // Ensure dotenv is installed

dotenv.config();

const prisma = new PrismaClient();

async function resetStudentPassword() {
    console.log('🔄 Resetting Student Password...');

    // Check if the user exists first. If not, create them.
    // The previous SQL inserted 'atharva@campus.edu'
    const email = 'atharva@campus.edu';
    const newPassword = 'admin123';

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`❌ User ${email} not found!`);
            // Create standard student
            const student = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Atharva Naik',
                    role: 'student',
                    department: 'Computer Science',
                    isFirstLogin: false
                }
            });
            console.log('✅ Created student user: atharva@campus.edu / admin123');
        } else {
            console.log(`Found student: ${user.name}`);
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    isFirstLogin: false
                }
            });
            console.log('✅ Student password updated to: admin123');
        }

    } catch (error: any) {
        console.error('❌ Error resetting student password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetStudentPassword();
