import { Router } from 'express';
import {
    createAsset,
    updateAsset,
    deleteAsset,
    getAllAssets,
    getAssetById,
    getAssetByQR,
    getAssetDetails,
    getAllAssetsWithStats,
    getFaultyAssets,
    searchAssets,
    getAssetsByLocation,
    getAssetFilters
} from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// ====================================================================
// 🎯 QR SCANNER ROUTES
// ====================================================================
router.get('/qr', authenticate, getAssetByQR); // GET /api/assets/qr?qrUrl=xxx
router.get('/:id/details', authenticate, getAssetDetails); // Full details with history

// ====================================================================
// 🔍 SEARCH & FILTER ROUTES
// ====================================================================
router.get('/search', authenticate, searchAssets); // Advanced search with filters
router.get('/location', authenticate, getAssetsByLocation); // Filter by location
router.get('/filters', authenticate, getAssetFilters); // Get available filter options

// ====================================================================
// 📊 STATS & MANAGEMENT ROUTES
// ====================================================================
router.get('/stats', authenticate, authorize(['admin']), getAllAssetsWithStats);
router.get('/faulty', authenticate, authorize(['admin', 'technician']), getFaultyAssets);

// ====================================================================
// ⚡ CRUD ROUTES (must be last to avoid conflicts)
// ====================================================================
router.post('/', authenticate, authorize(['admin']), createAsset);
router.put('/:id', authenticate, authorize(['admin']), updateAsset);
router.delete('/:id', authenticate, authorize(['admin']), deleteAsset);
router.get('/', authenticate, getAllAssets); // All roles can see assets
router.get('/:id', authenticate, getAssetById); // Basic asset info

export default router;
