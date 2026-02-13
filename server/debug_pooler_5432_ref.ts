
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

// Try Session Mode via Pooler (Port 5432) with PROJECT REF in USERNAME
const sessionUrl = "postgresql://postgres.wyjfgqfpgnzgbesdyixf:Atharv%402005!@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres";

async function testSessionPoolerWithRef() {
    console.log('Testing Session Mode via Pooler (Port 5432) with PROJECT REF...');
    console.log(`URL: ${sessionUrl.replace(/:[^:]*@/, ':****@')}`);

    const client = new Client({
        connectionString: sessionUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ Connected to Session Pooler (5432) successfully!');
        const res = await client.query('SELECT NOW()');
        console.log(`🕒 Database Time: ${res.rows[0].now}`);
        await client.end();
    } catch (err: any) {
        console.error('❌ Connection Failed:', err.message);
    }
}

testSessionPoolerWithRef();
