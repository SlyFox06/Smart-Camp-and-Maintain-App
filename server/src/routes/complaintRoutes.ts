import { Router } from 'express';
import {
    createComplaint,
    getMyComplaints,
    getAssignedComplaints,
    assignComplaint,
    updateComplaintStatus,
    getComplaintById,
    verifyOTP,
    handleApproval
} from '../controllers/complaintController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/', authenticate, authorize(['student', 'admin']), createComplaint);
router.get('/my-complaints', authenticate, authorize(['student']), getMyComplaints);
router.post('/:id/verify-otp', authenticate, authorize(['student']), verifyOTP);

// Technician routes
router.get('/assigned', authenticate, authorize(['technician']), getAssignedComplaints);

// Admin routes
router.post('/:id/assign', authenticate, authorize(['admin']), assignComplaint);
router.post('/:id/approval', authenticate, authorize(['admin']), handleApproval);

// Shared routes
// Ensure technician can access assigned complaints details
router.get('/:id', authenticate, getComplaintById);
router.patch('/:id/status', authenticate, authorize(['technician', 'admin']), updateComplaintStatus);

export default router;
