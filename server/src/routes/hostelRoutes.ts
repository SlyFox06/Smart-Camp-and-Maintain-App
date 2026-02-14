import { Router } from 'express';
import { getHostelDashboardStats, getPredictiveInsights, getStaffDistribution } from '../controllers/hostelController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Routes for Hostel Warden Analysis & Insights
router.get('/stats', authenticate as any, authorize(['warden', 'admin']) as any, getHostelDashboardStats);
router.get('/insights', authenticate as any, authorize(['warden', 'admin']) as any, getPredictiveInsights);
router.get('/staff-distribution', authenticate as any, authorize(['warden', 'admin']) as any, getStaffDistribution);

export default router;
