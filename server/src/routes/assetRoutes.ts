import { Router } from 'express';
import {
    createAsset,
    updateAsset,
    deleteAsset,
    getAllAssets,
    getAssetById,
    getAssetByQR,
    getActiveComplaint
} from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// QR Scanner Routes
router.get('/qr/:qrUrl', authenticate, getAssetByQR);

// CRUD Routes
router.post('/', authenticate, authorize(['admin']), createAsset);
router.put('/:id', authenticate, authorize(['admin']), updateAsset);
router.delete('/:id', authenticate, authorize(['admin']), deleteAsset);
router.get('/', authenticate, getAllAssets);
router.get('/:id', authenticate, getAssetById);
router.get('/:id/active-complaint', authenticate, getActiveComplaint);

export default router;
