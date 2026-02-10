import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection(url: string, name: string) {
    console.log(`\nTesting ${name}...`);
    const prisma = new PrismaClient({
        datasourceUrl: url
    });
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        console.log(`✅ ${name} Connection Successful! Found ${userCount} users.`);
        await prisma.$disconnect();
        return true;
    } catch (e: any) {
        console.log(`❌ ${name} Failed: ${e.message}`);
        return false;
    }
}

async function main() {
    console.log('--- Database Connection Debugger ---');

    // Test 1: Direct Connection (Port 5432)
    const directUrl = process.env.DIRECT_URL;
    if (directUrl) {
        await testConnection(directUrl, 'Direct Connection (Session Mode)');
    } else {
        console.log('Skipping Direct Connection test (DIRECT_URL not set)');
    }

    // Test 2: Pooler Connection (Port 6543)
    const poolerUrl = process.env.DATABASE_URL;
    if (poolerUrl) {
        await testConnection(poolerUrl, 'Pooler Connection (Transaction Mode)');
    } else {
        console.log('Skipping Pooler Connection test (DATABASE_URL not set)');
    }
}

main().catch(console.error);
