import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

// Import Routes
import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import complaintRoutes from './routes/complaintRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';
import roomRoutes from './routes/roomRoutes';
import classroomRoutes from './routes/classroomRoutes';

import prisma from './db/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

console.log('Loading routes...');

try {
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Failed to load Auth routes:', error);
}

try {
    app.use('/api/assets', assetRoutes);
    console.log('✅ Asset routes loaded');
} catch (error) {
    console.error('❌ Failed to load Asset routes:', error);
}

try {
    app.use('/api/rooms', roomRoutes);
    console.log('✅ Room routes loaded');
} catch (error) {
    console.error('❌ Failed to load Room routes:', error);
}

try {
    app.use('/api/classrooms', classroomRoutes);
    console.log('✅ Classroom routes loaded');
} catch (error) {
    console.error('❌ Failed to load Classroom routes:', error);
}

try {
    app.use('/api/complaints', complaintRoutes);
    console.log('✅ Complaint routes loaded');
} catch (error) {
    console.error('❌ Failed to load Complaint routes:', error);
}

try {
    app.use('/api/notifications', notificationRoutes);
    console.log('✅ Notification routes loaded');
} catch (error) {
    console.error('❌ Failed to load Notification routes:', error);
}

try {
    app.use('/api/admin', adminRoutes);
    console.log('✅ Admin routes loaded');
} catch (error) {
    console.error('❌ Failed to load Admin routes:', error);
}

try {
    app.use('/api/cleaners', require('./routes/cleanerRoutes').default);
    console.log('✅ Cleaner routes loaded');
} catch (error) {
    console.error('❌ Failed to load Cleaner routes:', error);
}

try {
    app.use('/api/cleaning-tasks', require('./routes/cleaningTaskRoutes').default);
    console.log('✅ Cleaning Task routes loaded');
} catch (error) {
    console.error('❌ Failed to load Cleaning Task routes:', error);
}

try {
    app.use('/api/emergency', require('./routes/emergencyRoutes').default);
    console.log('✅ Emergency routes loaded');
} catch (error) {
    console.error('❌ Failed to load Emergency routes:', error);
}

try {
    app.use('/api/hostel', require('./routes/hostelRoutes').default);
    console.log('✅ Hostel routes loaded');
} catch (error) {
    console.error('❌ Failed to load Hostel routes:', error);
}

// Health Check
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Schedule Escalation Check
const { checkEscalations } = require('./services/escalationService');
setInterval(checkEscalations, 60000); // Check every minute

// Initialize Scheduled Jobs (Cron)
import { initScheduledJobs } from './services/schedulerService';
initScheduledJobs();

import ip from 'ip';

// ... (existing imports)

// ...

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 Network URL: http://${ip.address()}:${PORT}`);
    console.log(`✅ Using Prisma via Supabase PostgreSQL`);
    console.log(`🔄 Server restarted with new email config at ${new Date().toLocaleTimeString()}`);
    console.log(`⏱️ Escalation Service Started`);
});
