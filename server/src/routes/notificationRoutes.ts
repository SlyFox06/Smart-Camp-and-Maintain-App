import { Router } from 'express';
import {
    getNotifications,
    markNotificationRead,
    markAllRead
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // Protect all routes

router.get('/', getNotifications);
router.put('/:id/read', markNotificationRead);
router.put('/read-all', markAllRead);

export default router;
