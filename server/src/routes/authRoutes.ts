import { Router } from 'express';
import {
    register,
    login,
    createUser,
    createTechnician,
    changePassword
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authenticate, changePassword);

// Admin only routes
router.post('/users', authenticate, authorize(['admin']), createUser);
router.post('/technicians', authenticate, authorize(['admin']), createTechnician);

export default router;
