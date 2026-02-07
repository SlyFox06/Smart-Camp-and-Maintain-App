# 🚀 Prisma to Supabase Migration Plan

## Migration Overview

**Objective:** Completely replace Prisma ORM with Supabase as the database and authentication provider.

**Duration:** 8-12 hours
**Risk Level:** HIGH
**Complexity:** 10/10

---

## Phase 1: Setup & Preparation (30 mins)

### 1.1 Create Supabase Project
- [ ] Go to https://supabase.com
- [ ] Create new project
- [ ] Note down:
  - Project URL
  - Anon/Public Key
  - Service Role Key (secret)
  - Database Password

### 1.2 Install Supabase Dependencies
```bash
cd server
npm install @supabase/supabase-js
npm uninstall prisma @prisma/client
```

### 1.3 Environment Variables
Update `server/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

---

## Phase 2: Database Schema Migration (1-2 hours)

### 2.1 Create SQL Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'admin', 'technician')),
    department VARCHAR(100),
    avatar TEXT,
    phone VARCHAR(20),
    is_first_login BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'operational' CHECK (status IN ('operational', 'under_maintenance', 'faulty', 'decommissioned')),
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    room VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    qr_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'reported' CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    images TEXT,
    video TEXT,
    otp VARCHAR(10),
    otp_verified BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians table
CREATE TABLE technicians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_type VARCHAR(100) NOT NULL,
    assigned_area VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    temporary_password VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status History table
CREATE TABLE status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_technician ON complaints(technician_id);
CREATE INDEX idx_complaints_asset ON complaints(asset_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_assets_status ON assets(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_technicians_updated_at BEFORE UPDATE ON technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: Policies will be added based on your auth strategy
-- For now, we'll use service role key which bypasses RLS
```

---

## Phase 3: Supabase Client Setup (30 mins)

### 3.1 Create Supabase Client
**File:** `server/src/db/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// Service role client (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Anon client (for client-side if needed)
export const supabaseAnon = createClient(
    supabaseUrl,
    process.env.SUPABASE_ANON_KEY!
);
```

### 3.2 Delete Prisma Files
- [ ] Delete `server/prisma/` directory
- [ ] Delete `server/src/db/prisma.ts`
- [ ] Delete `server/src/db/queries.ts` (will recreate with Supabase)

---

## Phase 4: Rewrite Database Queries (4-6 hours)

### 4.1 User Queries
**File:** `server/src/db/queries/userQueries.ts`
- [ ] findUserByEmail
- [ ] createUser
- [ ] updateUser
- [ ] getUserById
- [ ] getAllUsers

### 4.2 Asset Queries
**File:** `server/src/db/queries/assetQueries.ts`
- [ ] getAllAssets
- [ ] getAssetById
- [ ] createAsset
- [ ] updateAsset
- [ ] deleteAsset
- [ ] getAssetByQRUrl
- [ ] getAssetWithComplaints

### 4.3 Complaint Queries
**File:** `server/src/db/queries/complaintQueries.ts`
- [ ] createComplaint
- [ ] updateComplaint
- [ ] getAllComplaints
- [ ] getComplaintById
- [ ] getStudentComplaints
- [ ] getTechnicianComplaints
- [ ] getComplaintsByStatus

### 4.4 Notification Queries
**File:** `server/src/db/queries/notificationQueries.ts`
- [ ] createNotification
- [ ] getUserNotifications
- [ ] markAsRead

---

## Phase 5: Update Controllers (2-3 hours)

### 5.1 Replace All Prisma Imports
```typescript
// OLD
import { prisma } from '../db/prisma';

// NEW
import { supabase } from '../db/supabase';
```

### 5.2 Update Query Syntax
```typescript
// OLD (Prisma)
const user = await prisma.user.findUnique({ where: { email } });

// NEW (Supabase)
const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
```

### 5.3 Controllers to Update
- [ ] `authController.ts`
- [ ] `userController.ts`
- [ ] `assetController.ts`
- [ ] `complaintController.ts`
- [ ] `technicianController.ts`
- [ ] `analyticsController.ts`
- [ ] `notificationController.ts`

---

## Phase 6: Authentication Migration (1-2 hours)

### Option A: Keep Custom JWT Auth
- Update auth middleware to work with Supabase DB
- Keep existing bcrypt password hashing
- Keep existing JWT token generation

### Option B: Use Supabase Auth (Recommended)
- Migrate to Supabase Auth
- Use Supabase's built-in user management
- Simplify auth middleware

---

## Phase 7: Testing (2-3 hours)

### 7.1 Unit Testing
- [ ] Test each query function
- [ ] Test error handling
- [ ] Test edge cases

### 7.2 Integration Testing
- [ ] Test authentication flow
- [ ] Test complaint lifecycle
- [ ] Test technician assignment
- [ ] Test OTP verification
- [ ] Test notifications

### 7.3 End-to-End Testing
- [ ] Student workflow
- [ ] Admin workflow
- [ ] Technician workflow

---

## Phase 8: Data Migration (if needed)

If you have existing data in Prisma/PostgreSQL:
- [ ] Export data from current database
- [ ] Transform to Supabase format
- [ ] Import into Supabase tables
- [ ] Verify data integrity

---

## Rollback Plan

If migration fails:
1. Keep Prisma files in a backup branch
2. Revert package.json
3. Restore `prisma/` directory
4. Run `npm install`
5. Run `npx prisma generate`

---

## Key Differences: Prisma vs Supabase

| Feature | Prisma | Supabase |
|---------|--------|----------|
| **Query Syntax** | `prisma.user.findMany()` | `supabase.from('users').select()` |
| **Relations** | Auto-loaded with `include` | Manual joins with `select('*, relation(*)')` |
| **Transactions** | `prisma.$transaction()` | PostgreSQL transactions via RPC |
| **Error Handling** | Try-catch exceptions | Check `error` object |
| **Type Safety** | Auto-generated types | Manual type definitions |
| **Migrations** | Prisma migrate | SQL migrations |

---

## Estimated Timeline

- **Phase 1:** 30 mins
- **Phase 2:** 1-2 hours
- **Phase 3:** 30 mins
- **Phase 4:** 4-6 hours
- **Phase 5:** 2-3 hours
- **Phase 6:** 1-2 hours
- **Phase 7:** 2-3 hours
- **Phase 8:** 1-2 hours (if needed)

**Total:** 12-20 hours

---

## Next Steps

1. Create Supabase account and project
2. Share Supabase credentials with me
3. I'll start with Phase 1-3 (setup)
4. Then proceed with query migration
5. Test incrementally

**Ready to start?** Let me know when you have your Supabase project created!
