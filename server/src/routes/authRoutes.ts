import { Router } from 'express';
import {
    register,
    login,
    changePassword,
    createUser,
    createTechnician,
    createCleaner,
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

// Admin and Warden creates users
router.post('/users', authenticate, authorize(['admin', 'warden']), createUser);
router.post('/technicians', authenticate, authorize(['admin', 'warden']), createTechnician);
router.post('/cleaners', authenticate, authorize(['admin', 'warden']), createCleaner);

// Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
