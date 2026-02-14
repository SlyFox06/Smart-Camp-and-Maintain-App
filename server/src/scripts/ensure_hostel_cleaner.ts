import prisma from '../db/prisma';
import bcrypt from 'bcryptjs';

async function createHostelCleaner() {
    console.log('🧹 Creating/Updating Hostel Cleaner...');

    try {
        const email = 'hostel_cleaner@campus.edu';
        const hashedPassword = await bcrypt.hash('password123', 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                accessScope: 'both' // Ensure they can access hostel
            },
            create: {
                name: 'Hostel Cleaner',
                email,
                password: hashedPassword,
                role: 'cleaner',
                department: 'Housekeeping',
                phone: '9988776655',
                isActive: true,
                isFirstLogin: false,
                accessScope: 'hostel'
            }
        });

        await prisma.cleaner.upsert({
            where: { userId: user.id },
            update: {
                isAvailable: true
            },
            create: {
                userId: user.id,
                assignedArea: 'Hostels',
                isAvailable: true
            }
        });

        console.log('✅ Hostel Cleaner ready: hostel_cleaner@campus.edu / password123');

        // Also update existing seeded cleaners to 'both' access scope for testing flexibility
        await prisma.user.updateMany({
            where: {
                role: 'cleaner'
            },
            data: {
                accessScope: 'both'
            }
        });
        console.log('✅ Updated all cleaners to have "both" access scope for testing.');

    } catch (error) {
        console.error('❌ Error creating hostel cleaner:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createHostelCleaner();
