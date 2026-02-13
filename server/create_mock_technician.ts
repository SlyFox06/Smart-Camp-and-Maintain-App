import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'tech@campus.edu';
    const password = 'password123';

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        console.log(`\nTechnician already exists!`);
        console.log(`Email: ${email}`);
        // Since we can't retrieve the password, we assume it's the default if known, or warn user.
        // Ideally we reset it if needed, but let's just inform them.
        console.log(`Default Password: ${password} (If you haven't changed it)`);
    } else {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'John Technician',
                role: 'technician',
                phone: '555-0199',
                department: 'Maintenance',
                isFirstLogin: false, // Skip forced change for convenience
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=John`,
                technician: {
                    create: {
                        skillType: 'General Maintenance',
                        assignedArea: 'Campus Wide',
                        isAvailable: true
                    }
                }
            },
        });

        console.log(`\nTechnician created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
