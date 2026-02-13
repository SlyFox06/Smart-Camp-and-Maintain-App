import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllClassrooms,
    getClassroomById,
    createClassroom,
    updateClassroom,
    deleteClassroom
} from '../controllers/classroomController';

const router = express.Router();

// Admin can manage classrooms
const adminAuth = [authenticate, authorize(['admin'])];

router.get('/', ...adminAuth, getAllClassrooms);
router.get('/:id', getClassroomById); // Public for QR scanning
router.post('/', ...adminAuth, createClassroom);
router.put('/:id', ...adminAuth, updateClassroom);
router.delete('/:id', ...adminAuth, deleteClassroom);

export default router;
