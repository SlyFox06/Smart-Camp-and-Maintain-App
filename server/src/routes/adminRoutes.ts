import { Router } from 'express';
import {
    getAdminDashboard,
    getOverviewStats,
    getAllComplaints,
    getAllAssets,
    getAllUsers,
    getComplaintById,
    getAnalytics,
    getReports,
    updateUser,
    toggleUserStatus,
    searchGlobal,
    searchComplaints
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
router.get('/search', ...adminAuth, searchGlobal);

// Data Management
router.get('/users', ...adminAuth, getAllUsers);
router.get('/complaints', ...adminAuth, getAllComplaints);
router.get('/complaints/search', ...adminAuth, searchComplaints);
router.get('/complaints/:id', ...adminAuth, getComplaintById);
router.get('/assets', ...adminAuth, getAllAssets);

// User Management
router.put('/users/:id', ...adminAuth, updateUser);
router.patch('/users/:id/status', ...adminAuth, toggleUserStatus);

export default router;
