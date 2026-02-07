import { Request, Response } from 'express';
import { generateQRCode } from '../utils/qr';
import { supabase } from '../db/supabase';
import queries from '../db/queries';
import { toCamelCase } from '../utils/format';

// ====================================================================
// 🎯 QR SCANNER INTEGRATION
// ====================================================================

export const getAssetByQR = async (req: Request, res: Response) => {
    const { qrUrl } = req.query;

    if (!qrUrl || typeof qrUrl !== 'string') {
        return res.status(400).json({ message: 'QR URL is required' });
    }

    try {
        const asset = await queries.getAssetByQRUrl(qrUrl);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        const hasActiveComplaint = asset.complaints && asset.complaints.length > 0;

        res.json({
            asset,
            hasActiveComplaint,
            activeComplaintsCount: asset.complaints?.length || 0
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
};

export const getAssetDetails = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const asset = await queries.getAssetDetails(id as string);

        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        res.json(asset);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch asset details', error: error.message });
    }
};

// ====================================================================
// 📊 ASSET MANAGEMENT WITH STATS
// ====================================================================

export const getAllAssetsWithStats = async (req: Request, res: Response) => {
    try {
        const assets = await queries.getAllAssetsWithStats();
        // queries.getAllAssetsWithStats returns camelCase assets with complaints.

        const assetsWithStats = (assets || []).map((asset: any) => ({
            ...asset,
            stats: {
                totalComplaints: asset.complaints?.length || 0,
                activeComplaints: asset.complaints?.filter(
                    (c: any) => !['resolved', 'closed'].includes(c.status)
                ).length || 0,
                criticalIssues: asset.complaints?.filter(
                    (c: any) => c.severity === 'critical' && !['resolved', 'closed'].includes(c.status)
                ).length || 0
            },
            complaints: undefined // clear it
        }));

        res.json(assetsWithStats);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
};

export const getFaultyAssets = async (req: Request, res: Response) => {
    try {
        const faultyAssets = await queries.getFaultyAssets();
        res.json(faultyAssets);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch faulty assets', error: error.message });
    }
};

export const searchAssets = async (req: Request, res: Response) => {
    const { search } = req.query;

    try {
        if (search && typeof search === 'string') {
            const results = await queries.searchAssets(search);
            return res.json(results);
        }
        res.json([]);
    } catch (error: any) {
        res.status(500).json({ message: 'Asset search failed', error: error.message });
    }
};

export const getAssetsByLocation = async (req: Request, res: Response) => {
    const { building, floor, room } = req.query;

    try {
        const assets = await queries.getAssetsByLocation(
            building as string | undefined,
            floor as string | undefined,
            room as string | undefined
        );

        res.json(assets);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch assets by location', error: error.message });
    }
};

export const getAssetFilters = async (req: Request, res: Response) => {
    try {
        const { data: buildings } = await supabase.from('assets').select('building');
        const { data: departments } = await supabase.from('assets').select('department');
        const { data: types } = await supabase.from('assets').select('type');
        const { data: statuses } = await supabase.from('assets').select('status');

        const unique = (arr: any[], key: string) => [...new Set(arr?.map(i => i[key]))].sort();

        res.json({
            buildings: unique(buildings || [], 'building'),
            departments: unique(departments || [], 'department'),
            types: unique(types || [], 'type'),
            statuses: unique(statuses || [], 'status')
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch filters', error: error.message });
    }
};

export const createAsset = async (req: Request, res: Response) => {
    const { name, type, building, floor, room, department } = req.body;
    const userId = (req as any).user?.id;

    try {
        const { data: asset, error } = await supabase.from('assets').insert({
            name,
            type,
            building,
            floor,
            room,
            department,
            status: 'operational',
        }).select().single();

        if (error) throw error;

        const qrUrl = (await generateQRCode(asset.id)) as string;

        await supabase.from('assets').update({ qr_url: qrUrl }).eq('id', asset.id);

        if (userId) {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'ASSET_CREATED',
                details: `Created asset: ${name} at ${building} ${room}`
            });
        }

        res.status(201).json(toCamelCase({ ...asset, qrUrl }));
    } catch (error: any) {
        res.status(500).json({ message: 'Asset creation failed', error: error.message });
    }
};

export const updateAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body; // Assuming camelCase from frontend
    // const userId = (req as any).user?.id;

    try {
        // Map camelCase updateData to snake_case for Supabase
        // Ideally we need toSnakeCase helper, but for now we might rely on Supabase ignoring extra fields or handle it manually.
        // Given I made `toCamelCase`, I should probably make `toSnakeCase` or manually map.
        // Let's assume standard fields.

        // Manual mapping for safety
        const dbUpdateData: any = {};
        if (updateData.name) dbUpdateData.name = updateData.name;
        if (updateData.type) dbUpdateData.type = updateData.type;
        if (updateData.building) dbUpdateData.building = updateData.building;
        if (updateData.floor) dbUpdateData.floor = updateData.floor;
        if (updateData.room) dbUpdateData.room = updateData.room;
        if (updateData.department) dbUpdateData.department = updateData.department;
        if (updateData.status) dbUpdateData.status = updateData.status;

        const { data: asset, error } = await supabase
            .from('assets')
            .update(dbUpdateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        /*
        if (userId) {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'ASSET_UPDATED',
                details: `Updated asset ${id}`
            });
        }
        */

        res.json(toCamelCase(asset));
    } catch (error: any) {
        res.status(500).json({ message: 'Asset update failed', error: error.message });
    }
};

export const deleteAsset = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    try {
        const hasActive = await queries.hasActiveComplaint(id as string);

        if (hasActive) {
            return res.status(400).json({
                message: 'Cannot delete asset with active complaints'
            });
        }

        const { data: asset, error } = await supabase
            .from('assets')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (userId) {
            await supabase.from('audit_logs').insert({
                user_id: userId,
                action: 'ASSET_DELETED',
                details: `Deleted asset: ${asset.name}`
            });
        }

        res.json({ message: 'Asset deleted successfully', asset: toCamelCase(asset) });
    } catch (error: any) {
        res.status(500).json({ message: 'Asset deletion failed', error: error.message });
    }
};

export const getAllAssets = async (req: Request, res: Response) => {
    try {
        const { data: assets } = await supabase.from('assets').select('*').order('building', { ascending: true });
        res.json(toCamelCase(assets || []));
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
};

export const getAssetById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const asset = await queries.getAssetDetails(id);
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        res.json(asset);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
};

export const getActiveComplaint = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const { data: activeComplaint, error } = await supabase.from('complaints')
            .select(`*, student:users!student_id(*), technician:users!technician_id(*), asset:assets(*)`)
            .eq('asset_id', id)
            .in('status', ['reported', 'assigned', 'in_progress'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !activeComplaint) {
            return res.status(404).json({ message: 'No active complaint found' });
        }

        const transformedComplaint = {
            ...activeComplaint,
            images: activeComplaint.images ? JSON.parse(activeComplaint.images) : []
        };

        res.json(toCamelCase(transformedComplaint));
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to check active complaints', error: error.message });
    }
};
