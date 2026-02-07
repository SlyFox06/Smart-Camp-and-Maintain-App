import { Request, Response } from 'express';
import prisma from '../db/prisma';

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        // Get counts in parallel
        const [
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            totalAssets,
            faultyAssets,
            totalUsers,
            students,
            technicians
        ] = await Promise.all([
            prisma.complaint.count(),
            prisma.complaint.count({ where: { status: { in: ['reported', 'assigned', 'in_progress'] } } }),
            prisma.complaint.count({ where: { status: 'resolved' } }),
            prisma.asset.count(),
            prisma.asset.count({ where: { status: { in: ['faulty', 'under_maintenance'] } } }),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'student' } }),
            prisma.user.count({ where: { role: 'technician' } })
        ]);

        const analytics = {
            overview: {
                totalComplaints,
                activeComplaints,
                resolvedComplaints,
                totalAssets,
                faultyAssets,
                totalUsers,
                students,
                technicians
            },
            recentComplaints: await prisma.complaint.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: { select: { name: true, email: true } },
                    asset: { select: { name: true, type: true } }
                }
            }),
            statusDistribution: await prisma.complaint.groupBy({
                by: ['status'],
                _count: true
            })
        };

        res.json(analytics);
    } catch (error: any) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
    }
};

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
            prisma.complaint.count({ where: { status: { in: ['reported', 'assigned', 'in_progress'] } } }),
            prisma.complaint.count({ where: { status: 'resolved' } }),
            prisma.complaint.count({ where: { status: 'closed' } }),
            prisma.asset.count(),
            prisma.asset.count({ where: { status: { in: ['faulty', 'under_maintenance'] } } }),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'student' } }),
            prisma.user.count({ where: { role: 'technician' } })
        ]);

        res.json({
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            closedComplaints,
            totalAssets,
            faultyAssets,
            totalUsers,
            students,
            technicians,
            avgResolutionTime: 0 // Placeholder
        });
    } catch (error: any) {
        console.error('Overview stats error:', error);
        res.status(500).json({ message: 'Failed to fetch overview stats', error: error.message });
    }
};

export const getAllComplaints = async (req: Request, res: Response) => {
    try {
        const complaints = await prisma.complaint.findMany({
            include: {
                student: { select: { id: true, name: true, email: true, department: true, avatar: true } },
                technician: { select: { id: true, name: true, email: true, avatar: true } },
                asset: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(complaints);
    } catch (error: any) {
        console.error('Get complaints error:', error);
        res.status(500).json({ message: 'Failed to fetch complaints', error: error.message });
    }
};

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

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                phone: true,
                avatar: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

export const getComplaintById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: {
                student: true,
                technician: true,
                asset: true,
                statusHistory: {
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        res.json(complaint);
    } catch (error: any) {
        console.error('Get complaint error:', error);
        res.status(500).json({ message: 'Failed to fetch complaint', error: error.message });
    }
};

// Placeholder for other admin functions - these can be implemented as needed
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const [
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            byStatus,
            bySeverity
        ] = await Promise.all([
            prisma.complaint.count(),
            prisma.complaint.count({ where: { status: { in: ['reported', 'assigned', 'in_progress'] } } }),
            prisma.complaint.count({ where: { status: 'resolved' } }),
            prisma.complaint.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.complaint.groupBy({
                by: ['severity'],
                _count: true
            })
        ]);

        const complaintsByStatus = byStatus.reduce((acc, curr) => {
            acc[curr.status] = curr._count;
            return acc;
        }, {} as Record<string, number>);

        const complaintsBySeverity = bySeverity.reduce((acc, curr) => {
            acc[curr.severity] = curr._count;
            return acc;
        }, {} as Record<string, number>);

        res.json({
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            averageResolutionTime: 45,
            complaintsByStatus,
            complaintsBySeverity
        });
    } catch (error: any) {
        console.error('Analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
    }
};

export const getReports = (req: Request, res: Response) => {
    res.json({ message: 'Reports endpoint - implementation pending' });
};
