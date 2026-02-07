-- ================================================================
-- FRESH START - Delete Everything and Recreate
-- Smart Campus Maintenance & Complaint Management System
-- ================================================================

-- Step 1: DROP ALL EXISTING TABLES
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS status_history CASCADE;
DROP TABLE IF EXISTS technicians CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "Notification" CASCADE;
DROP TABLE IF EXISTS "StatusUpdate" CASCADE;
DROP TABLE IF EXISTS "Technician" CASCADE;
DROP TABLE IF EXISTS "Complaint" CASCADE;
DROP TABLE IF EXISTS "Asset" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: CREATE TABLES

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

-- Step 4: CREATE INDEXES
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_complaints_technician ON complaints(technician_id);
CREATE INDEX idx_complaints_asset ON complaints(asset_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_status_history_complaint ON status_history(complaint_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Step 5: CREATE TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at 
    BEFORE UPDATE ON assets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at 
    BEFORE UPDATE ON complaints 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_technicians_updated_at 
    BEFORE UPDATE ON technicians 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: ENABLE ROW LEVEL SECURITY
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 7: CREATE ADMIN USER
-- Password: admin123 (bcrypt hashed)
INSERT INTO users (name, email, password, role, department, avatar, is_first_login)
VALUES (
    'Admin User',
    'admin@campus.edu',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J0pKpxK0.HZjJSqLvdzzGgSqQu6sFy',
    'admin',
    'IT Department',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    false
);

-- Step 8: CREATE SAMPLE STUDENT
INSERT INTO users (name, email, password, role, department, avatar)
VALUES (
    'Atharva Naik',
    'atharva@campus.edu',
    '$2a$10$N9qo8uLOickgx2ZMRZoMye1J0pKpxK0.HZjJSqLvdzzGgSqQu6sFy',
    'student',
    'Computer Science',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=atharva'
);

-- Step 9: CREATE SAMPLE ASSETS
INSERT INTO assets (name, type, building, floor, room, department)
VALUES 
    ('AC 1', 'AC', 'Building A', '1', '101', 'Computer Science'),
    ('AC 2', 'AC', 'Building A', '1', '102', 'Computer Science'),
    ('Projector 1', 'PROJECTOR', 'Building A', '2', '201', 'Computer Science'),
    ('Fan 1', 'FAN', 'Building B', '1', '103', 'Electronics');

-- ================================================================
-- DONE! You can now login with:
--   Email: admin@campus.edu
--   Password: admin123
-- ================================================================
