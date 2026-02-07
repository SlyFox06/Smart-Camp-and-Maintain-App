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

import prisma from './db/prisma';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Health Check
app.get('/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected', timestamp: new Date() });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Using Prisma via Supabase PostgreSQL`);
});
