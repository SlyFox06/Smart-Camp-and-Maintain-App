import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const directUrl = process.env.DIRECT_URL;
const poolerUrl = process.env.DATABASE_URL;

async function testConnection(url: string | undefined, name: string) {
    if (!url) {
        console.log(`Checking ${name}: No URL found`);
        return;
    }
    // Safely log the URL masking the password
    const maskedUrl = url.replace(/:([^:@]+)@/, ':****@');
    console.log(`Checking ${name}: ${maskedUrl}...`);

    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually if it's external
    });

    try {
        await client.connect();
        console.log(`✅ ${name}: Connected successfully!`);
        const res = await client.query('SELECT NOW()');
        console.log(`   Time from DB: ${res.rows[0].now}`);
        await client.end();
    } catch (err: any) {
        console.error(`❌ ${name}: Connection failed -`, err.message);
        if (err.code) console.error(`   Error Code: ${err.code}`);
    }
}

async function main() {
    console.log('--- Starting Connection Test ---');
    await testConnection(poolerUrl, 'Pooling URL (DATABASE_URL)');
    await testConnection(directUrl, 'Direct URL (DIRECT_URL)');
    console.log('--- Test Completed ---');
}

main();
