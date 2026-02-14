import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllCleaners,
    updateAvailability,
    createCleaner,
    getCleanerByUserId,
    generateHostelTasks
} from '../controllers/cleanerController';

const router = express.Router();

// Admin routes
const adminAuth = [authenticate, authorize(['admin', 'warden'])]; // Updated to include warden

router.get('/', ...adminAuth, getAllCleaners);
router.post('/', ...adminAuth, createCleaner);
router.post('/tasks/generate', ...adminAuth, generateHostelTasks);

// Cleaner routes
const cleanerAuth = [authenticate, authorize(['cleaner', 'admin'])];

router.get('/me', ...cleanerAuth, getCleanerByUserId);
router.patch('/:cleanerId/availability', ...cleanerAuth, updateAvailability);

export default router;
