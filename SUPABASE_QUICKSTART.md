# 🚀 Supabase Migration - Quick Start Guide

## ⚠️ IMPORTANT: Read This First!

This migration will **completely replace** your current Prisma setup with Supabase. Make sure you:
1. **Backup your current database** (export all data)
2. **Commit all your current code** to Git
3. **Create a new branch** for this migration
4. **Have 8-12 hours** available to complete this

---

## 📋 Pre-Migration Checklist

- [ ] Current code is committed to Git
- [ ] Created backup branch: `git checkout -b backup-prisma`
- [ ] Created migration branch: `git checkout -b feature/supabase-migration`
- [ ] Have Supabase account ready
- [ ] Have time to complete migration

---

## Step 1: Create Supabase Project (5 mins)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub/Email
4. Click "New Project"
5. Fill in:
   - **Name:** `smart-campus-maintenance`
   - **Database Password:** (Generate a strong password - SAVE THIS!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free tier is fine
6. Click "Create new project"
7. Wait ~2 minutes for setup

### Get Your Credentials:

Once project is ready:
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**
   - **anon/public** key
   - **service_role** key (click "Reveal" first)

3. Go to **Settings** → **Database**
4. Scroll to **Connection string** → **URI**
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your database password

---

## Step 2: Update Environment Variables (2 mins)

**File:** `server/.env`

Add these lines (replace with your actual values):
```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Keep this for direct database access if needed
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

---

## Step 3: Run Database Schema (5 mins)

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase_schema.sql` from your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **RUN** (bottom right)
7. Wait for "Success. No rows returned"
8. Verify tables created:
   - Go to **Table Editor**
   - You should see: users, assets, complaints, technicians, etc.

---

## Step 4: Install Supabase Package (2 mins)

```bash
cd server
npm install @supabase/supabase-js
```

**DON'T uninstall Prisma yet** - we'll keep it as backup until migration is complete.

---

## Step 5: Test Supabase Connection (2 mins)

Create a test file:

**File:** `server/test-supabase.ts`
```typescript
import { supabase } from './src/db/supabase';

async function testConnection() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
        
        if (error) {
            console.error('❌ Connection failed:', error);
            return;
        }
        
        console.log('✅ Supabase connected successfully!');
        console.log('📊 Users table accessible');
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

testConnection();
```

Run it:
```bash
npx ts-node test-supabase.ts
```

Expected output:
```
✅ Supabase connected successfully!
📊 Users table accessible
```

If you see errors, check your .env file credentials.

---

## Step 6: Migrate One Controller at a Time

We'll migrate controllers incrementally to test as we go.

### 6.1 **Start with Auth Controller** (30 mins)

**File:** `server/src/controllers/authController.ts`

I'll create a migrated version. This is the most critical one.

### 6.2 **Then Asset Controller** (45 mins)

We already have most of this in `assetController.ts`

### 6.3 **Then Complaint Controller** (1 hour)

The most complex one - many queries to migrate

### 6.4 **Then Others** (2-3 hours)
- User Controller
- Technician Controller
- Analytics Controller
- Notification Controller

---

## Step 7: Update Each Controller

For each controller, the pattern is:

### OLD (Prisma):
```typescript
import { prisma } from '../db/prisma';

const user = await prisma.user.findUnique({
    where: { email }
});
```

### NEW (Supabase):
```typescript
import { supabase, handleSupabaseError } from '../db/supabase';

const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

if (error) handleSupabaseError(error, 'Find user by email');
```

---

## Common Query Conversions

### Find One
```typescript
// Prisma
const user = await prisma.user.findUnique({ where: { id } });

// Supabase
const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
```

### Find Many
```typescript
// Prisma
const users = await prisma.user.findMany();

// Supabase
const { data: users } = await supabase
    .from('users')
    .select('*');
```

### Find with Filter
```typescript
// Prisma
const assets = await prisma.asset.findMany({
    where: { status: 'operational' }
});

// Supabase
const { data: assets } = await supabase
    .from('assets')
    .select('*')
    .eq('status', 'operational');
```

### Create
```typescript
// Prisma
const user = await prisma.user.create({
    data: { name, email, password }
});

// Supabase
const { data: user } = await supabase
    .from('users')
    .insert({ name, email, password })
    .select()
    .single();
```

### Update
```typescript
// Prisma
const user = await prisma.user.update({
    where: { id },
    data: { name }
});

// Supabase
const { data: user } = await supabase
    .from('users')
    .update({ name })
    .eq('id', id)
    .select()
    .single();
```

### Delete
```typescript
// Prisma
await prisma.user.delete({ where: { id } });

// Supabase
await supabase
    .from('users')
    .delete()
    .eq('id', id);
```

### Relations (Joins)
```typescript
// Prisma
const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { student: true, asset: true }
});

// Supabase
const { data: complaint } = await supabase
    .from('complaints')
    .select(`
        *,
        student:users!student_id(*),
        asset:assets(*)
    `)
    .eq('id', id)
    .single();
```

---

## Step 8: Testing Strategy

After migrating each controller:

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test the endpoints:**
   - Login
   - Create asset
   - Create complaint
   - Etc.

3. **Check for errors in console**

4. **If it works, move to next controller**

5. **If it fails, debug and fix**

---

## Step 9: Seed Initial Data (10 mins)

Run this SQL in Supabase SQL Editor to create admin user:

```sql
-- Create admin user (password: admin123)
INSERT INTO users (name, email, password, role, department, avatar, is_first_login)
VALUES (
    'Admin User',
    'admin@campus.edu',
    '$2a$10$rL2v5KZ.NOGxQX7fZ5z2CuXKxJ8YxKx5YxKx5YxKx5YxKx5YxKx6O',
    'admin',
    'IT Department',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    false
);

-- Create test student (password: student123)
INSERT INTO users (name, email, password, role, department, avatar)
VALUES (
    'Atharva Naik',
    'atharva@campus.edu',
    '$2a$10$test.hash.here.student123',
    'student',
    'Computer Science',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=atharva'
);

-- Create test assets
INSERT INTO assets (name, type, building, floor, room, department)
VALUES 
    ('AC 1', 'AC', 'Building A', '1', '101', 'Computer Science'),
    ('AC 2', 'AC', 'Building A', '1', '102', 'Computer Science'),
    ('Projector 1', 'PROJECTOR', 'Building A', '2', '201', 'Computer Science');
```

Note: You'll need to generate proper bcrypt hashes for passwords!

---

## Step 10: Remove Prisma (Final Step)

**Only after everything works!**

```bash
cd server
npm uninstall prisma @prisma/client
rm -rf prisma/
rm src/db/prisma.ts
```

Update `package.json` - remove all Prisma scripts.

---

## Rollback Procedure

If something goes wrong:

```bash
git checkout backup-prisma
npm install
npx prisma generate
npm run dev
```

---

## Next Steps After Migration

Want me to:

**A)** Start migrating Auth Controller first (most critical)
**B)** Create query helper functions first
**C)** Wait for you to set up Supabase project

**Let me know when your Supabase project is ready, and I'll help you migrate!** 🚀
