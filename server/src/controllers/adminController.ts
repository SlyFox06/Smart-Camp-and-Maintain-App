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
        const { role, scope } = req.query;
        const where: any = role ? { role: String(role) } : {};

        if (scope) {
            where.accessScope = { in: [String(scope), 'both'] };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
                phone: true,
                avatar: true,
                isActive: true,
                createdAt: true,
                technician: {
                    select: {
                        assignedArea: true,
                        isAvailable: true
                    }
                },
                cleaner: {
                    select: {
                        assignedArea: true,
                        isAvailable: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(users);
    } catch (error: any) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { name, phone, department, skillType, assignedArea, accessScope } = req.body;
        const adminId = (req as any).user?.id;

        // Update basic user details
        const user = await prisma.user.update({
            where: { id },
            data: { name, phone, department, accessScope }
        });

        // If technician, update technician details
        if (user.role === 'technician' && (skillType || assignedArea)) {
            await prisma.technician.update({
                where: { userId: id },
                data: {
                    skillType,
                    assignedArea
                }
            });
        }

        // If cleaner, update cleaner details
        if (user.role === 'cleaner' && assignedArea) {
            await prisma.cleaner.update({
                where: { userId: id },
                data: {
                    assignedArea
                }
            });
        }

        // Audit Log
        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'USER_UPDATE',
                    details: `Updated user ${user.name} (${user.role})`
                }
            });
        }

        res.json(user);
    } catch (error: any) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
};

export const toggleUserStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const { isActive } = req.body;
        const adminId = (req as any).user?.id;

        const user = await prisma.user.update({
            where: { id },
            data: { isActive }
        });

        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'USER_STATUS_CHANGE',
                    details: `Changed ${user.name} status to ${isActive ? 'Active' : 'Inactive'}`
                }
            });
        }

        res.json(user);
    } catch (error: any) {
        console.error('Toggle status error:', error);
        res.status(500).json({ message: 'Failed to update status', error: error.message });
    }
};

export const searchGlobal = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;
        const query = String(q || '');

        if (!query) return res.json({ users: [], complaints: [], assets: [] });

        const [users, complaints, assets] = await Promise.all([
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            }),
            prisma.complaint.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5,
                include: { student: true, asset: true }
            }),
            prisma.asset.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { building: { contains: query, mode: 'insensitive' } }
                    ]
                },
                take: 5
            })
        ]);

        res.json({ users, complaints, assets });
    } catch (error: any) {
        console.error('Global search error:', error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

export const searchComplaints = async (req: Request, res: Response) => {
    try {
        const { q, status, student, technician, asset, scope } = req.query;
        const query = String(q || '');

        const where: any = {};

        if (query) {
            where.OR = [
                { title: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { id: { equals: query } } // Exact match for ID
            ];
        }

        if (status) where.status = String(status);
        if (scope) where.scope = String(scope);
        if (student) where.student = { name: { contains: String(student), mode: 'insensitive' } };
        if (technician) where.technician = { name: { contains: String(technician), mode: 'insensitive' } };
        if (asset) where.asset = { name: { contains: String(asset), mode: 'insensitive' } };

        const complaints = await prisma.complaint.findMany({
            where,
            include: {
                student: true,
                technician: true,
                asset: true,
                statusHistory: { orderBy: { timestamp: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(complaints);
    } catch (error: any) {
        console.error('Complaint search error:', error);
        res.status(500).json({ message: 'Search failed', error: error.message });
    }
};

export const getComplaintById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
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
        const { scope } = req.query;
        const whereClause: any = {};
        if (scope) {
            whereClause.scope = String(scope);
        }

        const [
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            byStatus,
            bySeverity
        ] = await Promise.all([
            prisma.complaint.count({ where: whereClause }),
            prisma.complaint.count({ where: { ...whereClause, status: { in: ['reported', 'assigned', 'in_progress'] } } }),
            prisma.complaint.count({ where: { ...whereClause, status: 'resolved' } }),
            prisma.complaint.groupBy({
                by: ['status'],
                where: whereClause,
                _count: true
            }),
            prisma.complaint.groupBy({
                by: ['severity'],
                where: whereClause,
                _count: true
            })
        ]);

        // ... (rest of the function is the same, just reconstructing the maps)
        const complaintsByStatus = byStatus.reduce((acc, curr) => {
            if (curr.status) {
                acc[curr.status] = curr._count;
            }
            return acc;
        }, {} as Record<string, number>);

        const complaintsBySeverity = bySeverity.reduce((acc, curr) => {
            if (curr.severity) {
                acc[curr.severity] = curr._count;
            }
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
