
import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { createNotification } from '../services/notificationService';

// Helper function to determine required skills for emergency type
const getRequiredSkillsForEmergency = (emergencyType: string): string[] => {
    const type = emergencyType.toLowerCase();

    if (type.includes('fire')) {
        return ['Electrical', 'General']; // Fire safety + general support
    } else if (type.includes('medical')) {
        return ['General']; // Any available staff for medical emergencies
    } else if (type.includes('electrical')) {
        return ['Electrical'];
    } else if (type.includes('lift') || type.includes('elevator')) {
        return ['Electrical', 'General']; // Electrical for lift mechanics
    } else {
        return ['General', 'Electrical', 'Plumbing', 'Computer', 'Carpentry']; // Any available
    }
};

export const createEmergency = async (req: Request, res: Response) => {
    try {
        const { type, location, description, assetId, evidence, isOfflineSync, reportedAt } = req.body;
        const reporterId = (req as any).user?.id;

        // Determine scope based on location
        let emergencyScope = 'college';
        const locationStr = typeof location === 'string' ? location : (location as any).text || '';
        if (locationStr.toLowerCase().includes('hostel')) {
            emergencyScope = 'hostel';
        }

        // Find available technician with matching skills AND scope
        const requiredSkills = getRequiredSkillsForEmergency(type);
        const availableTechnician = await prisma.technician.findFirst({
            where: {
                skillType: { in: requiredSkills },
                isAvailable: true,
                user: {
                    isActive: true,
                    accessScope: { in: [emergencyScope, 'both'] }
                }
            },
            include: { user: true },
            orderBy: { createdAt: 'asc' } // Prioritize senior
        });

        const emergencyData: any = {
            type,
            location: typeof location === 'string' ? location : JSON.stringify(location),
            description,
            status: 'triggered',
            evidence: evidence ? (typeof evidence === 'string' ? evidence : JSON.stringify(evidence)) : null,
            isOfflineSync: isOfflineSync || false,
            reporterId: reporterId || null,
            assetId: assetId || null,
            assignedToId: availableTechnician?.userId || null,
            reportedAt: isOfflineSync && reportedAt ? new Date(reportedAt) : new Date()
        };

        const emergency = await prisma.emergency.create({
            data: emergencyData,
            include: {
                reporter: true,
                asset: true,
                // @ts-ignore
                assignedTo: {
                    include: { technician: true }
                }
            }
        }) as any;

        // Always notify all admins
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });

        let assignmentMessage = '';
        if (availableTechnician) {
            await createNotification(
                availableTechnician.userId,
                '🚨 EMERGENCY ASSIGNED',
                `${type} Emergency at ${typeof location === 'string' ? location : (location as any).text || 'Unknown Location'}`,
                'emergency_assigned',
                emergency.id,
                'emergency'
            );
            assignmentMessage = `Auto-assigned to: ${availableTechnician.user.name}`;

            await prisma.auditLog.create({
                data: {
                    userId: availableTechnician.userId, // Assigned user ID or System ID? System ID is not available. Using the tech ID as "performer" might be confusing. Let's use reporter ID or leave user NULL if possible? AuditLog usually requires user. I'll skip writing specific assignee audit log HERE and rely on the record's existence. Admin notification below covers audit trail context.
                    action: 'EMERGENCY_AUTO_ASSIGNED',
                    details: `Emergency ${emergency.id} auto-assigned to ${availableTechnician.user.name}`
                }
            });
        } else {
            assignmentMessage = `⚠️ NO STAFF AVAILABLE - ESCALATED`;
            // Escalate immediately if no staff
            await prisma.emergency.update({
                where: { id: emergency.id },
                data: { escalationLevel: 1 } as any
            });
        }

        // Notify admins
        for (const admin of admins) {
            await createNotification(
                admin.id,
                '🚨 NEW EMERGENCY REPORT',
                `${type} Emergency. ${assignmentMessage}`,
                'emergency_alert',
                emergency.id,
                'emergency'
            );
        }

        res.status(201).json({
            ...emergency,
            message: assignmentMessage
        });

    } catch (error: any) {
        console.error('Create emergency error:', error);
        res.status(500).json({ message: 'Failed to report emergency', error: error.message });
    }
};

export const getActiveEmergencies = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const whereClause: any = {
            status: {
                in: ['triggered', 'responding'] // Fetch only active
            }
        };

        // If technician, only show assigned emergencies
        if (user.role === 'technician') {
            whereClause.assignedToId = user.id;
        }

        const emergencies = await prisma.emergency.findMany({
            where: whereClause,
            include: {
                reporter: true,
                asset: true,
                // @ts-ignore
                assignedTo: {
                    include: { technician: true }
                }
            },
            orderBy: {
                reportedAt: 'desc'
            }
        });
        res.json(emergencies);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch emergencies', error: error.message });
    }
};

export const updateEmergencyStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, assignedToId, escalationLevel } = req.body;
        const adminId = (req as any).user?.id;

        const emergencyId = String(id);

        const data: any = {};
        if (status) {
            data.status = status;
            if (status === 'responding') data.respondedAt = new Date();
            if (status === 'resolved') data.resolvedAt = new Date();
        }
        if (assignedToId) data.assignedToId = assignedToId;
        if (escalationLevel !== undefined) data.escalationLevel = escalationLevel;

        const emergency = await prisma.emergency.update({
            where: { id: emergencyId },
            data,
            include: {
                // @ts-ignore
                assignedTo: true
            }
        }) as any;

        // Notifications & Audit
        if (assignedToId && emergency.assignedTo) {
            await createNotification(
                assignedToId,
                '🚨 EMERGENCY RE-ASSIGNED',
                `You have been assigned to Emergency ${emergencyId}`,
                'emergency_assigned',
                emergencyId,
                'emergency'
            );
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'EMERGENCY_REASSIGNED',
                    details: `Assigned to ${emergency.assignedTo.name}`
                }
            });
        }

        if (status) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: `EMERGENCY_${status.toUpperCase()}`,
                    details: `Status updated to ${status}`
                }
            });
        }

        res.json(emergency);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update emergency', error: error.message });
    }
};
