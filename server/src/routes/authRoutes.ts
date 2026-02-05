import { Router } from 'express';
import { register, login, createUser } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Admin only: create technician or other admin
router.post('/users', authenticate, authorize(['admin']), createUser);

export default router;
