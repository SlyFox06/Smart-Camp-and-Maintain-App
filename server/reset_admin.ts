import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user = await prisma.user.update({
        where: { email: 'admin@campus.edu' },
        data: { password: hashedPassword }
    });

    console.log('✅ Admin password reset to: password123');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
