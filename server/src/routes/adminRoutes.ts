import { Router } from 'express';
import {
    getAdminDashboard,
    getOverviewStats,
    getComplaintsByStatus,
    getComplaintsBySeverity,
    getDepartmentStats,
    getTechniciansPerformance,
    getComplaintTrends,
    getRecentActivity,
    getTopComplaintAssets,
    getUsersByRole,
    getAuditLogs,
    exportData
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
const adminAuth = [authenticate, authorize(['admin'])];

// ====================================================================
// 📊 DASHBOARD & ANALYTICS
// ====================================================================
router.get('/dashboard', ...adminAuth, getAdminDashboard); // Complete dashboard data
router.get('/stats/overview', ...adminAuth, getOverviewStats); // High-level stats
router.get('/stats/complaints/status', ...adminAuth, getComplaintsByStatus); // By status
router.get('/stats/complaints/severity', ...adminAuth, getComplaintsBySeverity); // By severity
router.get('/stats/departments', ...adminAuth, getDepartmentStats); // Department breakdown
router.get('/stats/trends', ...adminAuth, getComplaintTrends); // Trends over time

// ====================================================================
// 👥 USER & TECHNICIAN MANAGEMENT
// ====================================================================
router.get('/users/:role', ...adminAuth, getUsersByRole); // Get users by role
router.get('/technicians/performance', ...adminAuth, getTechniciansPerformance); // Performance metrics

// ====================================================================
// 🏢 ASSET ANALYTICS
// ====================================================================
router.get('/assets/top-complaints', ...adminAuth, getTopComplaintAssets); // Most complained assets

// ====================================================================
// 📝 ACTIVITY & AUDIT
// ====================================================================
router.get('/activity/recent', ...adminAuth, getRecentActivity); // Recent activity feed
router.get('/audit-logs', ...adminAuth, getAuditLogs); // Audit trail

// ====================================================================
// 📤 DATA EXPORT
// ====================================================================
router.get('/export', ...adminAuth, exportData); // Export data for reports

export default router;
