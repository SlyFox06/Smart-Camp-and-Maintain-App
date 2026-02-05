import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import * as queries from '../db/queries';

// ====================================================================
// 📊 ADMIN DASHBOARD - COMPREHENSIVE ANALYTICS
// ====================================================================

/**
 * Get complete admin dashboard statistics
 * Optimized single endpoint for dashboard load
 */
export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const analytics = await queries.getAdminAnalytics();
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard', error });
    }
};

/**
 * Get real-time statistics overview
 */
export const getOverviewStats = async (req: Request, res: Response) => {
    try {
        const [
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            closedComplaints,
            totalAssets,
            faultyAssets,
            totalUsers,
            students,
            technicians
        ] = await Promise.all([
            prisma.complaint.count(),
            prisma.complaint.count({
                where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
            }),
            prisma.complaint.count({ where: { status: 'resolved' } }),
            prisma.complaint.count({ where: { status: 'closed' } }),
            prisma.asset.count(),
            prisma.asset.count({
                where: { status: { in: ['faulty', 'under_maintenance'] } }
            }),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'student' } }),
            prisma.user.count({ where: { role: 'technician' } })
        ]);

        // Calculate average resolution time
        const resolvedComplaintsList = await prisma.complaint.findMany({
            where: {
                status: { in: ['resolved', 'closed'] },
                resolvedAt: { not: null }
            },
            select: { createdAt: true, resolvedAt: true }
        });

        let avgResolutionTime = 0;
        if (resolvedComplaintsList.length > 0) {
            const totalMs = resolvedComplaintsList.reduce((acc, c) => {
                if (c.resolvedAt) {
                    return acc + (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime());
                }
                return acc;
            }, 0);
            avgResolutionTime = Math.floor(totalMs / resolvedComplaintsList.length / 3600000); // hours
        }

        res.json({
            complaints: {
                total: totalComplaints,
                active: activeComplaints,
                resolved: resolvedComplaints,
                closed: closedComplaints,
                avgResolutionTime
            },
            assets: {
                total: totalAssets,
                operational: totalAssets - faultyAssets,
                faulty: faultyAssets
            },
            users: {
                total: totalUsers,
                students,
                technicians,
                admins: totalUsers - students - technicians
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch overview stats', error });
    }
};

/**
 * Get complaints breakdown by status
 */
export const getComplaintsByStatus = async (req: Request, res: Response) => {
    try {
        const statusCounts = await prisma.complaint.groupBy({
            by: ['status'],
            _count: { _all: true }
        });

        const result: any = {
            reported: 0,
            assigned: 0,
            in_progress: 0,
            resolved: 0,
            closed: 0
        };

        statusCounts.forEach(item => {
            result[item.status] = item._count._all;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch status breakdown', error });
    }
};

/**
 * Get complaints breakdown by severity
 */
export const getComplaintsBySeverity = async (req: Request, res: Response) => {
    try {
        const severityCounts = await prisma.complaint.groupBy({
            by: ['severity'],
            _count: { _all: true }
        });

        const result: any = {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
        };

        severityCounts.forEach(item => {
            result[item.severity] = item._count._all;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch severity breakdown', error });
    }
};

/**
 * Get department-wise statistics
 */
export const getDepartmentStats = async (req: Request, res: Response) => {
    try {
        const stats = await queries.getDepartmentStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch department stats', error });
    }
};

/**
 * Get technician performance metrics
 */
export const getTechniciansPerformance = async (req: Request, res: Response) => {
    try {
        const technicians = await prisma.user.findMany({
            where: { role: 'technician' },
            include: {
                assignments: {
                    select: {
                        id: true,
                        status: true,
                        severity: true,
                        createdAt: true,
                        assignedAt: true,
                        resolvedAt: true
                    }
                }
            }
        });

        const performance = technicians.map(tech => {
            const assignments = tech.assignments;
            const resolved = assignments.filter((a: any) => a.status === 'resolved');

            let avgResolutionTime = 0;
            if (resolved.length > 0) {
                const totalMs = resolved.reduce((acc, a: any) => {
                    if (a.assignedAt && a.resolvedAt) {
                        return acc + (new Date(a.resolvedAt).getTime() - new Date(a.assignedAt).getTime());
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

        // Sort by total assignments descending
        performance.sort((a, b) => b.stats.totalAssignments - a.stats.totalAssignments);

        res.json(performance);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch technician performance', error });
    }
};

/**
 * Get complaint trends over time
 */
export const getComplaintTrends = async (req: Request, res: Response) => {
    const { days = '30' } = req.query;

    try {
        const trends = await queries.getComplaintTrends(parseInt(days as string));
        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch trends', error });
    }
};

/**
 * Get recent activity feed
 */
export const getRecentActivity = async (req: Request, res: Response) => {
    const { limit = '20' } = req.query;

    try {
        const activity = await queries.getRecentActivity(parseInt(limit as string));
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch recent activity', error });
    }
};

/**
 * Get top assets by complaint count
 */
export const getTopComplaintAssets = async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    try {
        const assets = await prisma.asset.findMany({
            include: {
                _count: {
                    select: { complaints: true }
                },
                complaints: {
                    where: { status: { notIn: ['resolved', 'closed'] } },
                    select: { severity: true }
                }
            },
            orderBy: {
                complaints: { _count: 'desc' }
            },
            take: parseInt(limit as string)
        });

        const result = assets.map(asset => ({
            id: asset.id,
            name: asset.name,
            location: `${asset.building} - ${asset.room}`,
            department: asset.department,
            status: asset.status,
            totalComplaints: (asset as any)._count.complaints,
            activeComplaints: asset.complaints.length,
            criticalIssues: asset.complaints.filter(c => c.severity === 'critical').length
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch top assets', error });
    }
};

/**
 * Get all users by role with stats
 */
export const getUsersByRole = async (req: Request, res: Response) => {
    const { role } = req.params;

    if (!role || typeof role !== 'string' || !['student', 'technician', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const users = await queries.getUsersByRole(role as 'student' | 'technician' | 'admin');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch users', error });
    }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (req: Request, res: Response) => {
    const { limit = '100', userId, action } = req.query;

    try {
        const logs = await queries.getAuditLogs(
            parseInt(limit as string),
            userId as string | undefined,
            action as string | undefined
        );
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs', error });
    }
};

/**
 * Export data for reports
 */
export const exportData = async (req: Request, res: Response) => {
    const { type, format = 'json' } = req.query;

    if (!type) {
        return res.status(400).json({ message: 'Export type required' });
    }

    try {
        let data: any;

        switch (type) {
            case 'complaints':
                data = await prisma.complaint.findMany({
                    include: {
                        asset: { select: { name: true, building: true, room: true } },
                        student: { select: { name: true, email: true, department: true } },
                        technician: { select: { name: true, email: true } }
                    }
                });
                break;

            case 'assets':
                data = await prisma.asset.findMany({
                    include: {
                        _count: { select: { complaints: true } }
                    }
                });
                break;

            case 'users':
                data = await prisma.user.findMany({
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        department: true,
                        createdAt: true
                    }
                });
                break;

            default:
                return res.status(400).json({ message: 'Invalid export type' });
        }

        // For now, just return JSON. In production, could generate CSV/Excel
        res.json({
            type,
            format,
            timestamp: new Date().toISOString(),
            count: data.length,
            data
        });
    } catch (error) {
        res.status(500).json({ message: 'Export failed', error });
    }
};
