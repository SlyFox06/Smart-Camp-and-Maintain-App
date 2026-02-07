import bcrypt from 'bcryptjs';
import * as fs from 'fs';

const generateAdminSQL = async () => {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const output = `
============================================================
ADMIN USER SETUP - COPY THE SQL BELOW
============================================================

Run this SQL in Supabase SQL Editor:

-- Delete existing admin user if any
DELETE FROM users WHERE email = 'admin@campus.edu';

-- Create admin user with correct password hash
INSERT INTO users (name, email, password, role, department, is_first_login)
VALUES (
    'Admin User',
    'admin@campus.edu',
    '${hashedPassword}',
    'admin',
    'IT Department',
    false
);

============================================================
After running this SQL, login with:
   Email: admin@campus.edu
   Password: admin123
============================================================
`;

    console.log(output);
    fs.writeFileSync('ADMIN_SETUP.sql', output, 'utf8');
    console.log('\n✅ SQL also saved to ADMIN_SETUP.sql');
};

generateAdminSQL();
