import { Request, Response } from 'express';
import { supabase } from '../db/supabase';
import queries from '../db/queries';

// ====================================================================
// 📊 ADMIN DASHBOARD - COMPREHENSIVE ANALYTICS
// ====================================================================

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const analytics = await queries.getAdminAnalytics();
        res.json(analytics);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
    }
};

export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        // Parallel count queries
        const [
            { count: totalComplaints },
            { count: activeComplaints },
            { count: resolvedComplaints },
            { count: closedComplaints },
            { count: totalAssets },
            { count: faultyAssets }, // 'faulty' or 'under_maintenance'
            { count: underMaintenanceAssets },
            { count: totalUsers },
            { count: students },
            { count: technicians }
        ] = await Promise.all([
            supabase.from('complaints').select('*', { count: 'exact', head: true }),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['reported', 'assigned', 'in_progress']),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
            supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
            supabase.from('assets').select('*', { count: 'exact', head: true }),
            supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'faulty'),
            supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', 'under_maintenance'),
            supabase.from('users').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
            supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'technician')
        ]);

        const totalFaulty = (faultyAssets || 0) + (underMaintenanceAssets || 0);

        // Calculate average resolution time
        const { data: resolvedList } = await supabase
            .from('complaints')
            .select('created_at, resolved_at')
            .in('status', ['resolved', 'closed'])
            .not('resolved_at', 'is', null);

        let avgResolutionTime = 0;
        if (resolvedList && resolvedList.length > 0) {
            const totalMs = resolvedList.reduce((acc, c: any) => {
                if (c.resolved_at) {
                    return acc + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime());
                }
                return acc;
            }, 0);
            avgResolutionTime = Math.floor(totalMs / resolvedList.length / 3600000); // hours
        }

        res.json({
            complaints: {
                total: totalComplaints || 0,
                active: activeComplaints || 0,
                resolved: resolvedComplaints || 0,
                closed: closedComplaints || 0,
                avgResolutionTime
            },
            assets: {
                total: totalAssets || 0,
                operational: (totalAssets || 0) - totalFaulty,
                faulty: totalFaulty
            },
            users: {
                total: totalUsers || 0,
                students: students || 0,
                technicians: technicians || 0,
                admins: (totalUsers || 0) - (students || 0) - (technicians || 0)
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch overview stats', error: error.message });
    }
};

export const getComplaintsByStatus = async (req: Request, res: Response) => {
    try {
        const { data } = await supabase.from('complaints').select('status');

        const result: any = {
            reported: 0,
            assigned: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0,
            rejected: 0
        };

        (data || []).forEach((c: any) => {
            if (result[c.status] !== undefined) result[c.status]++;
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch status breakdown', error: error.message });
    }
};

export const getComplaintsBySeverity = async (req: Request, res: Response) => {
    try {
        const { data } = await supabase.from('complaints').select('severity');

        const result: any = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };

        (data || []).forEach((c: any) => {
            if (result[c.severity] !== undefined) result[c.severity]++;
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch severity breakdown', error: error.message });
    }
};

export const getDepartmentStats = async (req: Request, res: Response) => {
    try {
        const stats = await queries.getDepartmentStats();
        res.json(stats);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch department stats', error: error.message });
    }
};

export const getTechniciansPerformance = async (req: Request, res: Response) => {
    try {
        const { data: technicians } = await supabase
            .from('users')
            .select(`
                id, name, department, email, phone,
                assignments:complaints!technician_id(id, status, severity, created_at, assigned_at, resolved_at)
            `)
            .eq('role', 'technician');

        const performance = (technicians || []).map((tech: any) => {
            const assignments = tech.assignments || [];
            const resolved = assignments.filter((a: any) => a.status === 'resolved');

            let avgResolutionTime = 0;
            if (resolved.length > 0) {
                const totalMs = resolved.reduce((acc: number, a: any) => {
                    if (a.assigned_at && a.resolved_at) {
                        return acc + (new Date(a.resolved_at).getTime() - new Date(a.assigned_at).getTime());
                    }
                    return acc;
                }, 0);
                avgResolutionTime = Math.floor(totalMs / resolved.length / 3600000); // hours
            }

            return {
                id: tech.id,
                name: tech.name,
                department: tech.department,
                email: tech.email,
                phone: tech.phone,
                stats: {
                    totalAssignments: assignments.length,
                    active: assignments.filter((a: any) => !['resolved', 'closed'].includes(a.status)).length,
                    resolved: resolved.length,
                    pending: assignments.filter((a: any) => a.status === 'assigned').length,
                    inProgress: assignments.filter((a: any) => a.status === 'in_progress').length,
                    avgResolutionTime,
                    resolutionRate: assignments.length > 0 ? Math.round((resolved.length / assignments.length) * 100) : 0
                }
            };
        });

        performance.sort((a: any, b: any) => b.stats.totalAssignments - a.stats.totalAssignments);
        res.json(performance);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch technician performance', error: error.message });
    }
};

export const getComplaintTrends = async (req: Request, res: Response) => {
    const { days = '30' } = req.query;

    try {
        const trends = await queries.getComplaintTrends(parseInt(days as string));
        res.json(trends);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch trends', error: error.message });
    }
};

export const getRecentActivity = async (req: Request, res: Response) => {
    const { limit = '20' } = req.query;

    try {
        const activity = await queries.getRecentActivity(parseInt(limit as string));
        res.json(activity);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch recent activity', error: error.message });
    }
};

export const getTopComplaintAssets = async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    try {
        // Fetch all assets and their active complaints count, then sort in memory.
        // Optimized: Just fetch needed fields.
        const { data: assets } = await supabase
            .from('assets')
            .select(`
                *,
                complaints!asset_id(id, status, severity)
            `);

        // Map and Sort
        const result = (assets || []).map((asset: any) => {
            const complaints = asset.complaints || [];
            return {
                id: asset.id,
                name: asset.name,
                location: `${asset.building} - ${asset.room}`,
                department: asset.department,
                status: asset.status,
                totalComplaints: complaints.length,
                activeComplaints: complaints.filter((c: any) => !['resolved', 'closed'].includes(c.status)).length,
                criticalIssues: complaints.filter((c: any) => c.severity === 'critical').length
            };
        });

        result.sort((a: any, b: any) => b.totalComplaints - a.totalComplaints);

        res.json(result.slice(0, parseInt(limit as string)));
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch top assets', error: error.message });
    }
};

export const getUsersByRole = async (req: Request, res: Response) => {
    const { role } = req.params;
    try {
        const users = await queries.getUsersByRole(role as 'student' | 'technician' | 'admin');
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

export const getAuditLogs = async (req: Request, res: Response) => {
    const { limit = '100', userId, action } = req.query;
    try {
        const logs = await queries.getAuditLogs(
            parseInt(limit as string),
            userId as string | undefined,
            action as string | undefined
        );
        res.json(logs);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
    }
};

export const exportData = async (req: Request, res: Response) => {
    const { type, format = 'json' } = req.query;

    if (!type) {
        return res.status(400).json({ message: 'Export type required' });
    }

    try {
        let data: any; // Using any for brevity

        switch (type) {
            case 'complaints':
                const { data: cData } = await supabase
                    .from('complaints')
                    .select(`
                        *,
                        asset:assets(name, building, room),
                        student:users!student_id(name, email, department),
                        technician:users!technician_id(name, email)
                    `);
                data = cData;
                break;

            case 'assets':
                const { data: aData } = await supabase
                    .from('assets')
                    .select(`*, complaints(count)`); // count not directly supported in nested like that easily without RPC or different query. 
                // Simplified to just asset data for now or fetch complants separately.
                data = aData;
                break;

            case 'users':
                const { data: uData } = await supabase
                    .from('users')
                    .select('id, name, email, role, department, created_at');
                data = uData;
                break;

            default:
                return res.status(400).json({ message: 'Invalid export type' });
        }

        res.json({
            type,
            format,
            timestamp: new Date().toISOString(),
            count: data ? data.length : 0,
            data: data || []
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Export failed', error: error.message });
    }
};
