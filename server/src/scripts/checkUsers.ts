import { prisma } from '../db/prisma';

const checkUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, name: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log('--- RECENT USERS IN SUPABASE DB ---');
        console.table(users);
        console.log('-----------------------------------');
    } catch (error) {
        console.error('Error connecting to DB:', error);
    } finally {
        await prisma.$disconnect();
    }
};

checkUsers();
