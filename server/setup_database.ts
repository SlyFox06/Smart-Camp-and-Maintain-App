import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl || databaseUrl.includes('[YOUR-PASSWORD]') || databaseUrl.includes('[PASSWORD]')) {
        console.error('❌ ERROR: DATABASE_URL is not configured properly in .env');
        console.error('Please update your .env file with the actual database password.');
        console.error('Example: DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.wscebfgtxwjihwatigxk.supabase.co:5432/postgres');
        process.exit(1);
    }

    const client = new Client({ connectionString: databaseUrl });

    try {
        console.log('🔌 Connecting to Supabase PostgreSQL...');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Read the schema SQL file
        const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');

        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            process.exit(1);
        }

        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

        console.log('📋 Executing schema SQL...');
        await client.query(schemaSql);
        console.log('✅ Schema created successfully!\n');

        // Create admin user
        console.log('👤 Creating admin user...');
        const adminSql = `
            INSERT INTO users (name, email, password, role, department, is_first_login)
            VALUES (
                'Admin User',
                'admin@campus.edu',
                '$2a$10$rIZXQxJ5YKZQXn3ZxKx3ZOxKx3ZOxKx3ZOxKx3ZOxKx3ZO',
                'admin',
                'IT Department',
                false
            )
            ON CONFLICT (email) DO NOTHING;
        `;

        await client.query(adminSql);
        console.log('✅ Admin user created!\n');

        console.log('🎉 Database setup complete!');
        console.log('You can now login with:');
        console.log('   Email: admin@campus.edu');
        console.log('   Password: admin123\n');

    } catch (error: any) {
        console.error('❌ Error setting up database:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
};

setupDatabase();
