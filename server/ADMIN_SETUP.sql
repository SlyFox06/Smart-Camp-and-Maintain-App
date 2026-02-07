
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
    '$2b$10$iwiVuA0zf3AcKHPrnN39EeY2Fq6ZxROZx0KWKE3wDfille4CBSOZO',
    'admin',
    'IT Department',
    false
);

============================================================
After running this SQL, login with:
   Email: admin@campus.edu
   Password: admin123
============================================================
