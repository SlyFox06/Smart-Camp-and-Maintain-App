import { Request, Response } from 'express';
import { generateQRCode } from '../utils/qr';
import { prisma } from '../db/prisma';
import * as queries from '../db/queries';

// ====================================================================
// 🎯 QR SCANNER INTEGRATION
// ====================================================================

/**
 * Get asset by QR code URL (for QR scanner)
 * Optimized query with active complaints check
 */
export const getAssetByQR = async (req: Request, res: Response) => {
    const { qrUrl } = req.query;

    if (!qrUrl || typeof qrUrl !== 'string') {
        return res.status(400).json({ message: 'QR URL is required' });
    }

    try {
        // Use optimized pre-built query
        const asset = await queries.getAssetByQRUrl(qrUrl);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Check if asset has active complaints
        const hasActiveComplaint = asset.complaints && asset.complaints.length > 0;

        res.json({
            asset,
            hasActiveComplaint,
            activeComplaintsCount: asset.complaints?.length || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch asset', error });
    }
};

/**
 * Get asset details with full complaint history
 */
export const getAssetDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const asset = await queries.getAssetDetails(id as string);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch asset details', error });
    }
};

// ====================================================================
// 📊 ASSET MANAGEMENT WITH STATS
// ====================================================================

/**
 * Get all assets with complaint statistics
 * Optimized for admin dashboard
 */
export const getAllAssetsWithStats = async (req: Request, res: Response) => {
    try {
        const assets = await queries.getAllAssetsWithStats();

        // Calculate stats for each asset
        const assetsWithStats = assets.map((asset: any) => ({
            ...asset,
            stats: {
                totalComplaints: asset.complaints.length,
                activeComplaints: asset.complaints.filter(
                    (c: any) => !['resolved', 'closed'].includes(c.status)
                ).length,
                criticalIssues: asset.complaints.filter(
                    (c: any) => c.severity === 'critical' && !['resolved', 'closed'].includes(c.status)
                ).length
            },
            // Remove full complaints array to reduce payload size
            complaints: undefined
        }));

        res.json(assetsWithStats);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assets', error });
    }
};

/**
 * Get faulty assets needing immediate attention
 */
export const getFaultyAssets = async (req: Request, res: Response) => {
    try {
        const faultyAssets = await queries.getFaultyAssets();
        res.json(faultyAssets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch faulty assets', error });
    }
};

// ====================================================================
// 🔍 COMPLEX FILTERS & SEARCH
// ====================================================================

/**
 * Advanced asset search with multiple filters
 * Query params: building, floor, room, department, type, status, search
 */
export const searchAssets = async (req: Request, res: Response) => {
    const {
        building,
        floor,
        room,
        department,
        type,
        status,
        search,
        includeStats
    } = req.query;

    try {
        // If simple search term provided, use optimized search query
        if (search && typeof search === 'string' && !building && !floor && !room) {
            const results = await queries.searchAssets(search);
            return res.json(results);
        }

        // Build complex filter query
        const assets = await prisma.asset.findMany({
            where: {
                ...(building && { building: building as string }),
                ...(floor && { floor: floor as string }),
                ...(room && { room: room as string }),
                ...(department && { department: department as string }),
                ...(type && { type: type as string }),
                ...(status && { status: status as string }),
                ...(search && {
                    OR: [
                        { name: { contains: search as string } },
                        { building: { contains: search as string } },
                        { room: { contains: search as string } }
                    ]
                })
            },
            include: {
                ...(includeStats === 'true' && {
                    complaints: {
                        select: { id: true, status: true, severity: true }
                    }
                })
            },
            orderBy: [
                { status: 'asc' }, // Faulty first
                { building: 'asc' },
                { floor: 'asc' },
                { room: 'asc' }
            ]
        });

        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Asset search failed', error });
    }
};

/**
 * Get assets by location (building/floor/room)
 */
export const getAssetsByLocation = async (req: Request, res: Response) => {
    const { building, floor, room } = req.query;

    try {
        const assets = await queries.getAssetsByLocation(
            building as string | undefined,
            floor as string | undefined,
            room as string | undefined
        );

        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assets by location', error });
    }
};

/**
 * Get unique values for filters (building, floor, department, type)
 */
export const getAssetFilters = async (req: Request, res: Response) => {
    try {
        const [buildings, departments, types, statuses] = await Promise.all([
            prisma.asset.groupBy({ by: ['building'] }),
            prisma.asset.groupBy({ by: ['department'] }),
            prisma.asset.groupBy({ by: ['type'] }),
            prisma.asset.groupBy({ by: ['status'] })
        ]);

        res.json({
            buildings: buildings.map(b => b.building).sort(),
            departments: departments.map(d => d.department).sort(),
            types: types.map(t => t.type).sort(),
            statuses: statuses.map(s => s.status).sort()
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch filters', error });
    }
};

// ====================================================================
// ⚡ OPTIMIZED CRUD OPERATIONS
// ====================================================================

/**
 * Create asset with optimized transaction
 */
export const createAsset = async (req: Request, res: Response) => {
    const { name, type, building, floor, room, department } = req.body;
    const userId = (req as any).user?.id;

    try {
        // Use transaction for atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create asset
            const asset = await tx.asset.create({
                data: {
                    name,
                    type,
                    building,
                    floor,
                    room,
                    department,
                    status: 'operational',
                },
            });

            // 2. Generate QR Code
            const qrUrl = (await generateQRCode(asset.id)) as string;

            // 3. Update asset with QR URL
            const updatedAsset = await tx.asset.update({
                where: { id: asset.id },
                data: { qrUrl },
            });

            // 4. Create audit log
            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'ASSET_CREATED',
                        details: `Created asset: ${name} at ${building} ${room}`
                    }
                });
            }

            return updatedAsset;
        });

        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Asset creation failed', error });
    }
};

/**
 * Update asset with audit logging
 */
export const updateAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = (req as any).user?.id;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.update({
                where: { id },
                data: updateData
            });

            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'ASSET_UPDATED',
                        details: `Updated asset ${id}: ${JSON.stringify(updateData)}`
                    }
                });
            }

            return asset;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Asset update failed', error });
    }
};

/**
 * Delete asset (soft delete by setting status to decommissioned)
 */
export const deleteAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
        // Check for active complaints
        const hasActive = await queries.hasActiveComplaint(id as string);

        if (hasActive) {
            return res.status(400).json({
                message: 'Cannot delete asset with active complaints'
            });
        }

        const result = await prisma.$transaction(async (tx) => {
            const asset = await tx.asset.delete({
                where: { id }
            });

            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: 'ASSET_DELETED',
                        details: `Deleted asset: ${asset.name}`
                    }
                });
            }

            return asset;
        });

        res.json({ message: 'Asset deleted successfully', asset: result });
    } catch (error) {
        res.status(500).json({ message: 'Asset deletion failed', error });
    }
};

/**
 * Basic get all assets (for backwards compatibility)
 */
export const getAllAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' },
                { room: 'asc' }
            ]
        });
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assets', error });
    }
};

/**
 * Get asset by ID (basic)
 */
export const getAssetById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const asset = await prisma.asset.findUnique({
            where: { id: id as string },
            include: {
                complaints: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch asset', error });
    }
};
