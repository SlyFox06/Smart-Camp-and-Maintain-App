import { Router } from 'express';
import {
    createComplaint,
    getMyComplaints,
    getAssignedComplaints,
    assignComplaint,
    updateComplaintStatus,
    getComplaintById,
    verifyOTP,
    handleApproval,
    submitWork,
    reviewWork,
    submitFeedback
} from '../controllers/complaintController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Student routes
router.post('/', authenticate, authorize(['student', 'admin']), createComplaint);
router.get('/my-complaints', authenticate, authorize(['student']), getMyComplaints);
router.post('/:id/verify-otp', authenticate, authorize(['student']), verifyOTP);
router.post('/:id/feedback', authenticate, authorize(['student']), submitFeedback); // NEW

// Technician routes
router.get('/assigned', authenticate, authorize(['technician']), getAssignedComplaints);
router.post('/:id/work-submit', authenticate, authorize(['technician']), submitWork); // NEW

// Admin routes
router.post('/:id/assign', authenticate, authorize(['admin']), assignComplaint);
router.post('/:id/approval', authenticate, authorize(['admin']), handleApproval);
router.post('/:id/work-review', authenticate, authorize(['admin']), reviewWork); // NEW

// Shared routes
// Ensure technician can access assigned complaints details
router.get('/:id', authenticate, getComplaintById);
router.patch('/:id/status', authenticate, authorize(['technician', 'admin']), updateComplaintStatus);

export default router;
