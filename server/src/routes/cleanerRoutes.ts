import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllCleaners,
    updateAvailability,
    createCleaner,
    getCleanerByUserId
} from '../controllers/cleanerController';

const router = express.Router();

// Admin routes
const adminAuth = [authenticate, authorize(['admin'])];

router.get('/', ...adminAuth, getAllCleaners);
router.post('/', ...adminAuth, createCleaner);

// Cleaner routes
const cleanerAuth = [authenticate, authorize(['cleaner', 'admin'])];

router.get('/me', ...cleanerAuth, getCleanerByUserId);
router.put('/:cleanerId/availability', ...cleanerAuth, updateAvailability);

export default router;
