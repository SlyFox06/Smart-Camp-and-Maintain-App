/**
 * Smart Campus Maintenance - Database Query Examples
 * 
 * This file contains comprehensive examples for common database operations
 * organized by feature/use case.
 */

import { prisma } from './prisma';

// ====================================================================
// 🎯 QR SCANNER QUERIES
// ====================================================================

/**
 * Get asset details by scanning QR code
 * Used when: Student scans QR code on equipment
 */
export const getAssetByQRUrl = async (qrUrl: string) => {
    return await prisma.asset.findFirst({
        where: { qrUrl },
        include: {
            // Include active complaints to show if equipment already has issue reported
            complaints: {
                where: {
                    status: { notIn: ['resolved', 'closed'] }
                },
                include: {
                    student: { select: { name: true, email: true } },
                    technician: { select: { name: true } }
                }
            }
        }
    });
};

/**
 * Get asset by ID with full details
 * Used when: Displaying asset info after QR scan
 */
export const getAssetDetails = async (assetId: string) => {
    return await prisma.asset.findUnique({
        where: { id: assetId },
        include: {
            complaints: {
                orderBy: { createdAt: 'desc' },
                take: 10, // Last 10 complaints
                include: {
                    student: {
                        select: { id: true, name: true, email: true, department: true }
                    },
                    technician: {
                        select: { id: true, name: true }
                    }
                }
            }
        }
    });
};

/**
 * Check if asset has active complaint
 * Used when: Before creating new complaint
 */
export const hasActiveComplaint = async (assetId: string) => {
    const count = await prisma.complaint.count({
        where: {
            assetId,
            status: { notIn: ['resolved', 'closed'] }
        }
    });
    return count > 0;
};

// ====================================================================
// 👨‍🎓 STUDENT DASHBOARD QUERIES
// ====================================================================

/**
 * Get student's complaints with full details
 * Used when: Loading student dashboard
 */
export const getStudentDashboard = async (studentId: string) => {
    const complaints = await prisma.complaint.findMany({
        where: { studentId },
        include: {
            asset: true,
            technician: {
                select: { id: true, name: true, phone: true, email: true }
            },
            statusHistory: {
                orderBy: { timestamp: 'desc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const stats = {
        total: complaints.length,
        active: complaints.filter(c => !['resolved', 'closed'].includes(c.status)).length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        closed: complaints.filter(c => c.status === 'closed').length,
    };

    return { complaints, stats };
};

/**
 * Get complaint by ID with full tracking history
 */
export const getComplaintWithHistory = async (complaintId: string) => {
    return await prisma.complaint.findUnique({
        where: { id: complaintId },
        include: {
            asset: true,
            student: {
                select: { id: true, name: true, email: true, phone: true, department: true }
            },
            technician: {
                select: { id: true, name: true, email: true, phone: true }
            },
            statusHistory: {
                orderBy: { timestamp: 'desc' }
            }
        }
    });
};

// ====================================================================
// 🔧 TECHNICIAN DASHBOARD QUERIES
// ====================================================================

/**
 * Get technician's assigned complaints
 * Used when: Loading technician dashboard
 */
export const getTechnicianWorkload = async (technicianId: string) => {
    const complaints = await prisma.complaint.findMany({
        where: { technicianId },
        include: {
            asset: true,
            student: {
                select: { id: true, name: true, email: true, phone: true, department: true }
            }
        },
        orderBy: [
            { severity: 'desc' }, // Critical first
            { createdAt: 'asc' }  // Oldest first
        ]
    });

    const workload = {
        total: complaints.length,
        assigned: complaints.filter(c => c.status === 'assigned').length,
        inProgress: complaints.filter(c => c.status === 'in_progress').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
        bySeverity: {
            critical: complaints.filter(c => c.severity === 'critical').length,
            high: complaints.filter(c => c.severity === 'high').length,
            medium: complaints.filter(c => c.severity === 'medium').length,
            low: complaints.filter(c => c.severity === 'low').length,
        }
    };

    return { complaints, workload };
};

/**
 * Get pending complaints for a technician (assigned but not started)
 */
export const getPendingAssignments = async (technicianId: string) => {
    return await prisma.complaint.findMany({
        where: {
            technicianId,
            status: 'assigned'
        },
        include: {
            asset: true,
            student: { select: { name: true, phone: true } }
        },
        orderBy: { severity: 'desc' }
    });
};

// ====================================================================
// 👨‍💼 ADMIN DASHBOARD QUERIES
// ====================================================================

/**
 * Get comprehensive admin analytics
 * Used when: Loading admin dashboard
 */
export const getAdminAnalytics = async () => {
    // Total counts
    const totalComplaints = await prisma.complaint.count();
    const totalAssets = await prisma.asset.count();
    const totalUsers = await prisma.user.count();

    // Active vs resolved
    const activeComplaints = await prisma.complaint.count({
        where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
    });
    const resolvedComplaints = await prisma.complaint.count({
        where: { status: 'resolved' }
    });

    // By status
    const complaintsByStatus = await prisma.complaint.groupBy({
        by: ['status'],
        _count: { _all: true }
    });

    // By severity
    const complaintsBySeverity = await prisma.complaint.groupBy({
        by: ['severity'],
        _count: { _all: true }
    });

    // By department
    const complaintsByDepartment = await prisma.complaint.groupBy({
        by: ['studentId'],
        _count: { _all: true }
    });

    // Asset health
    const assetsByStatus = await prisma.asset.groupBy({
        by: ['status'],
        _count: { _all: true }
    });

    // Average resolution time
    const resolvedComplaintsList = await prisma.complaint.findMany({
        where: {
            status: 'resolved',
            resolvedAt: { not: null }
        },
        select: { createdAt: true, resolvedAt: true }
    });

    let avgResolutionTime = 0;
    if (resolvedComplaintsList.length > 0) {
        const totalMs = resolvedComplaintsList.reduce((acc, c) => {
            return acc + (new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime());
        }, 0);
        avgResolutionTime = Math.floor(totalMs / resolvedComplaintsList.length / 3600000); // hours
    }

    // Technician performance
    const technicianStats = await prisma.user.findMany({
        where: { role: 'technician' },
        select: {
            id: true,
            name: true,
            department: true,
            assignments: {
                select: {
                    id: true,
                    status: true,
                    severity: true,
                    createdAt: true,
                    resolvedAt: true
                }
            }
        }
    });

    return {
        overview: {
            totalComplaints,
            activeComplaints,
            resolvedComplaints,
            totalAssets,
            totalUsers,
            avgResolutionTime
        },
        complaintsByStatus,
        complaintsBySeverity,
        assetsByStatus,
        technicianStats
    };
};

/**
 * Get all users by role
 */
export const getUsersByRole = async (role: 'student' | 'technician' | 'admin') => {
    return await prisma.user.findMany({
        where: { role },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            department: true,
            avatar: true,
            createdAt: true,
            // Include complaint counts
            ...(role === 'student' && {
                complaints: {
                    select: { id: true, status: true }
                }
            }),
            ...(role === 'technician' && {
                assignments: {
                    select: { id: true, status: true }
                }
            })
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Get recent activity for admin dashboard
 */
export const getRecentActivity = async (limit: number = 20) => {
    const recentComplaints = await prisma.complaint.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            asset: { select: { name: true, room: true, building: true } },
            student: { select: { name: true, department: true } },
            technician: { select: { name: true } }
        }
    });

    const recentStatusUpdates = await prisma.statusUpdate.findMany({
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
            complaint: {
                include: {
                    asset: { select: { name: true } },
                    student: { select: { name: true } }
                }
            }
        }
    });

    return { recentComplaints, recentStatusUpdates };
};

// ====================================================================
// 🏢 ASSET MANAGEMENT QUERIES
// ====================================================================

/**
 * Get all assets with complaint counts
 */
export const getAllAssetsWithStats = async () => {
    return await prisma.asset.findMany({
        include: {
            complaints: {
                select: { id: true, status: true, severity: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Get assets by location
 */
export const getAssetsByLocation = async (
    building?: string,
    floor?: string,
    room?: string
) => {
    return await prisma.asset.findMany({
        where: {
            ...(building && { building }),
            ...(floor && { floor }),
            ...(room && { room })
        },
        include: {
            complaints: {
                where: { status: { notIn: ['resolved', 'closed'] } }
            }
        }
    });
};

/**
 * Get faulty assets (need immediate attention)
 */
export const getFaultyAssets = async () => {
    return await prisma.asset.findMany({
        where: {
            OR: [
                { status: 'faulty' },
                { status: 'under_maintenance' },
                {
                    complaints: {
                        some: {
                            status: { in: ['reported', 'assigned', 'in_progress'] },
                            severity: { in: ['high', 'critical'] }
                        }
                    }
                }
            ]
        },
        include: {
            complaints: {
                where: { status: { notIn: ['resolved', 'closed'] } },
                include: {
                    student: { select: { name: true } },
                    technician: { select: { name: true } }
                }
            }
        }
    });
};

// ====================================================================
// 🔔 NOTIFICATION QUERIES
// ====================================================================

/**
 * Get unread notifications count
 */
export const getUnreadNotificationCount = async (userId: string) => {
    return await prisma.notification.count({
        where: {
            userId,
            read: false
        }
    });
};

/**
 * Get all notifications for user
 */
export const getUserNotifications = async (userId: string, limit: number = 50) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
    });
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (notificationId: string) => {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true }
    });
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (userId: string) => {
    return await prisma.notification.updateMany({
        where: {
            userId,
            read: false
        },
        data: { read: true }
    });
};

// ====================================================================
// 📊 ADVANCED ANALYTICS QUERIES
// ====================================================================

/**
 * Get complaint trends over time
 */
export const getComplaintTrends = async (days: number = 30) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const complaints = await prisma.complaint.findMany({
        where: {
            createdAt: { gte: startDate }
        },
        select: {
            createdAt: true,
            status: true,
            severity: true
        }
    });

    // Group by date
    const trendsByDate = complaints.reduce((acc, complaint) => {
        const date = complaint.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = { total: 0, bySeverity: {}, byStatus: {} };
        }
        acc[date].total++;
        acc[date].bySeverity[complaint.severity] = (acc[date].bySeverity[complaint.severity] || 0) + 1;
        acc[date].byStatus[complaint.status] = (acc[date].byStatus[complaint.status] || 0) + 1;
        return acc;
    }, {} as any);

    return trendsByDate;
};

/**
 * Get technician performance metrics
 */
export const getTechnicianPerformance = async (technicianId: string) => {
    const assignments = await prisma.complaint.findMany({
        where: { technicianId },
        select: {
            id: true,
            status: true,
            severity: true,
            createdAt: true,
            assignedAt: true,
            resolvedAt: true
        }
    });

    const resolved = assignments.filter(a => a.status === 'resolved');

    let avgResolutionTime = 0;
    if (resolved.length > 0) {
        const totalMs = resolved.reduce((acc, a) => {
            if (a.assignedAt && a.resolvedAt) {
                return acc + (new Date(a.resolvedAt).getTime() - new Date(a.assignedAt).getTime());
            }
            return acc;
        }, 0);
        avgResolutionTime = Math.floor(totalMs / resolved.length / 3600000); // hours
    }

    return {
        totalAssignments: assignments.length,
        resolved: resolved.length,
        pending: assignments.filter(a => a.status === 'assigned').length,
        inProgress: assignments.filter(a => a.status === 'in_progress').length,
        avgResolutionTime,
        resolutionRate: assignments.length > 0 ? (resolved.length / assignments.length) * 100 : 0
    };
};

/**
 * Get department-wise statistics
 */
export const getDepartmentStats = async () => {
    const assetsByDept = await prisma.asset.groupBy({
        by: ['department'],
        _count: { _all: true }
    });

    const users = await prisma.user.findMany({
        select: {
            department: true,
            role: true,
            complaints: { select: { id: true } },
            assignments: { select: { id: true } }
        }
    });

    // Aggregate by department
    const deptStats: any = {};
    users.forEach(user => {
        if (!user.department) return;
        if (!deptStats[user.department]) {
            deptStats[user.department] = {
                students: 0,
                technicians: 0,
                complaints: 0,
                assignments: 0
            };
        }
        if (user.role === 'student') deptStats[user.department].students++;
        if (user.role === 'technician') deptStats[user.department].technicians++;
        deptStats[user.department].complaints += user.complaints?.length || 0;
        deptStats[user.department].assignments += user.assignments?.length || 0;
    });

    return { assetsByDept, deptStats };
};

// ====================================================================
// 🔍 SEARCH & FILTER QUERIES
// ====================================================================

/**
 * Search complaints with filters
 */
export const searchComplaints = async (filters: {
    status?: string[];
    severity?: string[];
    department?: string;
    building?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
}) => {
    return await prisma.complaint.findMany({
        where: {
            ...(filters.status && { status: { in: filters.status } }),
            ...(filters.severity && { severity: { in: filters.severity } }),
            ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
            ...(filters.dateTo && { createdAt: { lte: filters.dateTo } }),
            ...(filters.searchTerm && {
                OR: [
                    { title: { contains: filters.searchTerm } },
                    { description: { contains: filters.searchTerm } }
                ]
            }),
            ...(filters.building && {
                asset: { building: filters.building }
            })
        },
        include: {
            asset: true,
            student: { select: { name: true, department: true } },
            technician: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

/**
 * Search assets
 */
export const searchAssets = async (searchTerm: string) => {
    return await prisma.asset.findMany({
        where: {
            OR: [
                { name: { contains: searchTerm } },
                { type: { contains: searchTerm } },
                { building: { contains: searchTerm } },
                { room: { contains: searchTerm } },
                { department: { contains: searchTerm } }
            ]
        },
        include: {
            complaints: {
                where: { status: { notIn: ['resolved', 'closed'] } }
            }
        }
    });
};

// ====================================================================
// 🔐 AUDIT LOG QUERIES
// ====================================================================

/**
 * Create audit log entry
 */
export const createAuditLog = async (
    userId: string,
    action: string,
    details: string
) => {
    return await prisma.auditLog.create({
        data: {
            userId,
            action,
            details
        }
    });
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (
    limit: number = 100,
    userId?: string,
    action?: string
) => {
    return await prisma.auditLog.findMany({
        where: {
            ...(userId && { userId }),
            ...(action && { action })
        },
        include: {
            user: {
                select: { name: true, email: true, role: true }
            }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
    });
};

export default {
    // QR Scanner
    getAssetByQRUrl,
    getAssetDetails,
    hasActiveComplaint,

    // Student Dashboard
    getStudentDashboard,
    getComplaintWithHistory,

    // Technician Dashboard
    getTechnicianWorkload,
    getPendingAssignments,

    // Admin Dashboard
    getAdminAnalytics,
    getUsersByRole,
    getRecentActivity,

    // Asset Management
    getAllAssetsWithStats,
    getAssetsByLocation,
    getFaultyAssets,

    // Notifications
    getUnreadNotificationCount,
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Analytics
    getComplaintTrends,
    getTechnicianPerformance,
    getDepartmentStats,

    // Search
    searchComplaints,
    searchAssets,

    // Audit
    createAuditLog,
    getAuditLogs
};
