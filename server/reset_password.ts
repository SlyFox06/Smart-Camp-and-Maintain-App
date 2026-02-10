import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function resetPassword() {
    console.log('🔄 Resetting Admin Password...');

    const email = 'admin@campus.edu';
    const newPassword = 'admin123';

    try {
        // 1. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log(`Generated hash for '${newPassword}': ${hashedPassword.substring(0, 20)}...`);

        // 2. Find the user first to make sure they exist
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`❌ User ${email} not found!Creating new admin...`);
            // Create if not exists (fallback)
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: 'Admin User',
                    role: 'admin',
                    department: 'IT',
                    isFirstLogin: false
                }
            });
            console.log('✅ Admin user created with password: admin123');
        } else {
            console.log(`Found user: ${user.name} (${user.id})`);
            // 3. Update the password
            await prisma.user.update({
                where: { email },
                data: {
                    password: hashedPassword,
                    isFirstLogin: false // Ensure they don't get forced to change it immediately if not needed
                }
            });
            console.log('✅ Password updated successfully to: admin123');
        }

    } catch (error: any) {
        console.error('❌ Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
