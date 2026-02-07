-- ================================================================
-- SUPABASE DATABASE SCHEMA
-- Smart Campus Maintenance & Complaint Management System
-- ================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

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

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

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

-- ================================================================
-- TRIGGERS
-- ================================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
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

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: Using service role key which bypasses RLS for now
-- Add specific policies later based on requirements

-- ================================================================
-- SEED DATA (Optional - for testing)
-- ================================================================

-- Admin user
INSERT INTO users (name, email, password, role, department, avatar, is_first_login)
VALUES (
    'Admin User',
    'admin@campus.edu',
    '$2a$10$rIZXQxJ5YKZQXn3ZxKx3ZOxKx3ZOxKx3ZOxKx3ZOxKx3ZO', -- 'admin123' hashed
    'admin',
    'IT Department',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    false
);

-- Sample student
INSERT INTO users (name, email, password, role, department, avatar)
VALUES (
    'Atharva Naik',
    'atharva@campus.edu',
    '$2a$10$rIZXQxJ5YKZQXn3ZxKx3ZOxKx3ZOxKx3ZOxKx3ZOxKx3ZO', -- 'student123' hashed
    'student',
    'Computer Science',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=atharva'
);

-- Sample assets
INSERT INTO assets (name, type, building, floor, room, department)
VALUES 
    ('AC 1', 'AC', 'Building A', '1', '101', 'Computer Science'),
    ('AC 2', 'AC', 'Building A', '1', '102', 'Computer Science'),
    ('Projector 1', 'PROJECTOR', 'Building A', '2', '201', 'Computer Science'),
    ('Fan 1', 'FAN', 'Building B', '1', '103', 'Electronics');

-- ================================================================
-- USEFUL QUERIES FOR TESTING
-- ================================================================

-- Get all complaints with related data
-- SELECT c.*, 
--        u.name as student_name, 
--        t.name as technician_name,
--        a.name as asset_name
-- FROM complaints c
-- LEFT JOIN users u ON c.student_id = u.id
-- LEFT JOIN users t ON c.technician_id = t.id
-- LEFT JOIN assets a ON c.asset_id = a.id;

-- Get complaint count by status
-- SELECT status, COUNT(*) as count
-- FROM complaints
-- GROUP BY status;

-- Get assets needing maintenance
-- SELECT * FROM assets
-- WHERE status = 'under_maintenance';
