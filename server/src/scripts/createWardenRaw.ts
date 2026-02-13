
import { Client } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const createWarden = async () => {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('No database connection string found');
        return;
    }

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database...');

        // Fix constraint issue
        console.log('Removing restrictive role constraint...');
        await client.query('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');

        // Also fix status constraint if any? No, likely just role.

        const email = 'warden@campus.edu';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            console.log(`Warden already exists: ${email}`);
            // Update password just in case
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
            console.log(`Password reset to: ${password}`);
        } else {
            console.log('Creating new warden...');
            const res = await client.query(
                `INSERT INTO users (name, email, password, role, department, access_scope, is_first_login, is_active, updated_at) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
                ['Hostel Warden', email, hashedPassword, 'warden', 'Hostel Administration', 'hostel', false, true]
            );
            console.log(`Warden created successfully!`);
            console.log(`Email: ${res.rows[0].email}`);
            console.log(`Password: ${password}`);
        }
    } catch (err: any) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
};

createWarden();
