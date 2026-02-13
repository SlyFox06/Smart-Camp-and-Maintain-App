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

// All routes require authentication
const adminAuth = [authenticate, authorize(['admin'])];
const wardenAuth = [authenticate, authorize(['admin', 'warden'])];

// Dashboard & Analytics
router.get('/dashboard', ...adminAuth, getAdminDashboard);
router.get('/stats/overview', ...wardenAuth, getOverviewStats);
router.get('/analytics', ...wardenAuth, getAnalytics);
router.get('/reports', ...adminAuth, getReports);
router.get('/search', ...adminAuth, searchGlobal);

// Data Management
router.get('/users', ...wardenAuth, getAllUsers);
router.get('/complaints', ...wardenAuth, getAllComplaints);
router.get('/complaints/search', ...wardenAuth, searchComplaints);
router.get('/complaints/:id', ...wardenAuth, getComplaintById);
router.get('/assets', ...adminAuth, getAllAssets);

// User Management
router.put('/users/:id', ...wardenAuth, updateUser);
router.patch('/users/:id/status', ...wardenAuth, toggleUserStatus);

export default router;
