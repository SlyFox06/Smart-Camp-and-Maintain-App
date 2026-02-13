
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const poolerUrl = "postgresql://postgres.wyjfgqfpgnzgbesdyixf:Atharv%402005!@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

async function testPooler() {
    console.log('Testing connection to Supabase Pooler...');
    console.log(`URL: ${poolerUrl.replace(/:[^:]*@/, ':****@')}`);

    const client = new Client({
        connectionString: poolerUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000 // 10s timeout
    });

    try {
        await client.connect();
        console.log('✅ Connected to Pooler successfully!');
        const res = await client.query('SELECT NOW()');
        console.log(`🕒 Database Time: ${res.rows[0].now}`);
        await client.end();
    } catch (err: any) {
        console.error('❌ Connection Failed:', err.message);
        if (err.code) console.error('   Code:', err.code);
    }
}

testPooler();
