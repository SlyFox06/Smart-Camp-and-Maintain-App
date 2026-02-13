
import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const updateConstraints = async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL is not configured properly in .env');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });

    try {
        console.log('🔌 Connecting to Supabase PostgreSQL...');
        await client.connect();

        console.log('🛠️ Removing restrictive constraints...');

        // Drop the constraint that restricts status values to 'reported', 'assigned', etc.
        // This fails when we introduce 'work_submitted'. 
        // Dropping it allows the application logic to define valid statuses.
        await client.query(`
            ALTER TABLE complaints 
            DROP CONSTRAINT IF EXISTS complaints_status_check;
        `);
        console.log('✅ Dropped constraint: complaints_status_check');

        console.log('🎉 Database updated to allow new statuses!');

    } catch (error: any) {
        console.error('❌ Error updating constraints:', error.message);
    } finally {
        await client.end();
    }
};

updateConstraints();
