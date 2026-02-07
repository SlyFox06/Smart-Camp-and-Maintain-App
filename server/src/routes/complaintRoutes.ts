import { Router } from 'express';
import {
    createComplaint,
    approveComplaint,
    updateComplaintStatus,
    verifyOTP,
    getAnalytics,
    getStudentComplaints,
    getTechnicianComplaints,
    getAllComplaints
} from '../controllers/complaintController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize(['student']), createComplaint);
router.post('/:id/approval', authenticate, authorize(['admin']), approveComplaint); // Admin Approval
router.patch('/:id/status', authenticate, authorize(['technician', 'admin']), updateComplaintStatus);
router.post('/:id/verify', authenticate, authorize(['student']), verifyOTP);
router.get('/analytics', authenticate, authorize(['admin']), getAnalytics);

router.get('/student', authenticate, authorize(['student']), getStudentComplaints);
router.get('/technician', authenticate, authorize(['technician']), getTechnicianComplaints);
router.get('/admin', authenticate, authorize(['admin']), getAllComplaints);

export default router;
