import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@campus.edu';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                name: 'Super Admin',
                role: 'admin',
                department: 'Administration',
                phone: '+91 00000 00000',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
            }
        });
        console.log('✅ Admin user created: admin@campus.edu / admin123');
    } else {
        console.log('ℹ️ Admin user already exists');
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
