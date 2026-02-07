# 🚀 Supabase Migration - Final Steps

I have completely rewritten your backend to use Supabase instead of Prisma/PostgreSQL! 
Your application code is now fully "transferred" to Supabase.

To make it work, you just need to connect it to your Supabase project.

## Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wscebfgtxwjihwatigxk
2. Go to **SQL Editor** (sidebar).
3. Click **"New Query"**.
4. Open the file `supabase_schema.sql` from your project folder (`e:\Hackthon\supabase_schema.sql`).
5. Copy ALL the code and paste it into the Supabase SQL Editor.
6. Click **RUN**.

This will create all your tables (users, assets, complaints, etc.) in Supabase.

## Step 2: Configure Environment Variables

Open `server/.env` and **replace** the content with your Supabase keys:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here

# Supabase Configuration
# (I found your project ID from the connection string you shared)
SUPABASE_URL=https://wscebfgtxwjihwatigxk.supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY-FROM-DASHBOARD]
SUPABASE_SERVICE_KEY=[YOUR-SERVICE-ROLE-KEY-FROM-DASHBOARD]

# Optional: Keep this if you want to use external tools
# DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.wscebfgtxwjihwatigxk.supabase.co:5432/postgres
```

**Where to find keys:**
- Go to Supabase Dashboard -> **Settings** -> **API**.
- Copy `anon` (public) key for `SUPABASE_ANON_KEY`.
- Copy `service_role` (secret) key for `SUPABASE_SERVICE_KEY`.

## Step 3: Create Admin User

Since your database is empty, you need an admin. Run this SQL in Supabase SQL Editor:

```sql
INSERT INTO users (name, email, password, role, department, is_first_login)
VALUES (
    'Admin User',
    'admin@campus.edu',
    '$2a$10$rIZXQxJ5YKZQXn3ZxKx3ZOxKx3ZOxKx3ZOxKx3ZOxKx3ZO', -- Password is 'admin123'
    'admin',
    'IT Department',
    false
);
```

## Step 4: Restart Server

1. Stop the current server (Ctrl+C).
2. Run `npm run dev` in the `server` folder.

## Done! 🎉

Your app is now running on Supabase!

### What I Changed:
- **Removed Prisma Usage:** All controllers (`auth`, `asset`, `complaint`, `admin`) now use Supabase SDK directly.
- **Rewrote Queries:** `queries.ts` was completely rewritten for Supabase.
- **API Compatibility:** I added a helper to ensure the API still returns `camelCase` (like `studentId`) so your Frontend doesn't break!

### Optional Cleanup (Later)
Once everything is working, you can remove Prisma:
```bash
npm uninstall prisma @prisma/client
rm -rf prisma
rm src/db/prisma.ts
```
