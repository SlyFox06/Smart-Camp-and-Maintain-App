import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('password123', 10);

    await prisma.user.updateMany({
        data: { password: hashedPassword }
    });

    console.log('✅ All user passwords reset to: password123');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
