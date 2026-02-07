import { Request, Response } from 'express';
import prisma from '../db/prisma';

export const getAllAssets = async (req: Request, res: Response) => {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                complaints: {
                    where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(assets);
    } catch (error: any) {
        console.error('Get assets error:', error);
        res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
};

export const getAssetById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const asset = await prisma.asset.findUnique({
            where: { id },
            include: {
                complaints: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error: any) {
        console.error('Get asset error:', error);
        res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    try {
        const { name, type, building, floor, room, department } = req.body;
        const userId = (req as any).user?.id;

        const asset = await prisma.asset.create({
            data: {
                name,
                type,
                building,
                floor,
                room,
                department,
                status: 'operational'
            }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ASSET_CREATED',
                    details: `Created asset: ${name} (${type})`
                }
            });
        }

        res.status(201).json(asset);
    } catch (error: any) {
        console.error('Create asset error:', error);
        res.status(500).json({ message: 'Failed to create asset', error: error.message });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = (req as any).user?.id;

        const asset = await prisma.asset.update({
            where: { id },
            data: updateData
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ASSET_UPDATED',
                    details: `Updated asset: ${asset.name}`
                }
            });
        }

        res.json(asset);
    } catch (error: any) {
        console.error('Update asset error:', error);
        res.status(500).json({ message: 'Failed to update asset', error: error.message });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

        const asset = await prisma.asset.delete({
            where: { id }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ASSET_DELETED',
                    details: `Deleted asset: ${asset.name}`
                }
            });
        }

        res.json({ message: 'Asset deleted successfully', asset });
    } catch (error: any) {
        console.error('Delete asset error:', error);
        res.status(500).json({ message: 'Failed to delete asset', error: error.message });
    }
};

export const getAssetByQR = async (req: Request, res: Response) => {
    try {
        const { qrUrl } = req.params;
        const asset = await prisma.asset.findFirst({
            where: { qrUrl }
        });

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error: any) {
        console.error('Get asset by QR error:', error);
        res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
};

export const getActiveComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const complaint = await prisma.complaint.findFirst({
            where: {
                assetId: id,
                status: {
                    in: ['reported', 'assigned', 'in_progress', 'verified']
                }
            },
            include: {
                student: true
            }
        });

        res.json(complaint || null);
    } catch (error: any) {
        console.error('Check active complaint error:', error);
        res.status(500).json({ message: 'Failed to check active complaint', error: error.message });
    }
};
