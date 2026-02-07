import { Router } from 'express';
import {
    getAdminDashboard,
    getOverviewStats,
    getAllComplaints,
    getAllAssets,
    getAllUsers,
    getComplaintById,
    getAnalytics,
    getReports
} from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require admin authentication
const adminAuth = [authenticate, authorize(['admin'])];

// Dashboard & Analytics
router.get('/dashboard', ...adminAuth, getAdminDashboard);
router.get('/stats/overview', ...adminAuth, getOverviewStats);
router.get('/analytics', ...adminAuth, getAnalytics);
router.get('/reports', ...adminAuth, getReports);

// Data Management
router.get('/complaints', ...adminAuth, getAllComplaints);
router.get('/complaints/:id', ...adminAuth, getComplaintById);
router.get('/assets', ...adminAuth, getAllAssets);

export default router;
