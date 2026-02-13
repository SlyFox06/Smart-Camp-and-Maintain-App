import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllCleaningTasks,
    generateDailyTasks,
    manualAssignTask,
    updateTaskStatus,
    getTaskStatistics
} from '../controllers/cleaningTaskController';

const router = express.Router();

// Admin routes
const adminAuth = [authenticate, authorize(['admin'])];

router.get('/', ...adminAuth, getAllCleaningTasks);
router.post('/generate', ...adminAuth, generateDailyTasks);
router.put('/:taskId/assign', ...adminAuth, manualAssignTask);
router.get('/statistics', ...adminAuth, getTaskStatistics);

// Cleaner routes
const cleanerAuth = [authenticate, authorize(['cleaner', 'admin'])];

router.put('/:taskId/status', ...cleanerAuth, updateTaskStatus);

export default router;
