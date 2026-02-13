
import express from 'express';
import { createEmergency, getActiveEmergencies, updateEmergencyStatus } from '../controllers/emergencyController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Public endpoint for reporting emergency
router.post('/', createEmergency);

// Protected endpoints for dashboard
// Protected endpoints for dashboard
router.get('/', authenticate, authorize(['admin', 'warden', 'technician']), getActiveEmergencies);
router.patch('/:id/status', authenticate, authorize(['admin', 'warden', 'technician']), updateEmergencyStatus);

export default router;
