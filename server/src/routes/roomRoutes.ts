import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomByQR,
    getActiveComplaint
} from '../controllers/roomController';

const router = express.Router();

// Warden and admin can manage rooms
const wardenAuth = [authenticate, authorize(['admin', 'warden'])];

router.get('/', ...wardenAuth, getAllRooms);
router.get('/:id', ...wardenAuth, getRoomById);
router.post('/', ...wardenAuth, createRoom);
router.put('/:id', ...wardenAuth, updateRoom);
router.delete('/:id', ...wardenAuth, deleteRoom);
router.get('/qr/:qrUrl', getRoomByQR); // Public for QR scanning
router.get('/:id/active-complaint', getActiveComplaint);

export default router;
