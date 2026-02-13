import { Router } from 'express';
import {
    register,
    login,
    changePassword,
    createUser,
    createTechnician,
    updateAvailability,
    forgotPassword,
    resetPassword
} from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', authenticate, changePassword);
router.patch('/availability', authenticate, authorize(['technician']), updateAvailability);

// Admin only routes
router.post('/users', authenticate, authorize(['admin']), createUser);
router.post('/technicians', authenticate, authorize(['admin']), createTechnician);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
