
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
        const { type, location, description } = req.body;

        const emergency = await prisma.emergency.create({
            data: {
                type,
                location: JSON.stringify(location),
                description,
                status: 'triggered'
            }
        });

        // Smart Auto-Assignment Logic
        const requiredSkills = getRequiredSkillsForEmergency(type);

        // Find available technicians with matching skills
        const availableTechnicians = await prisma.technician.findMany({
            where: {
                skillType: { in: requiredSkills },
                isAvailable: true,
                user: {
                    isActive: true
                }
            },
            include: {
                user: true
            },
            orderBy: {
                createdAt: 'asc' // Prioritize senior technicians
            },
            take: 3 // Assign up to 3 technicians for emergencies
        });

        // Always notify all admins
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });

        let assignmentMessage = '';

        if (availableTechnicians.length > 0) {
            // Notify assigned technicians
            for (const tech of availableTechnicians) {
                await createNotification(
                    tech.userId,
                    '🚨 EMERGENCY - IMMEDIATE RESPONSE REQUIRED',
                    `${type} Emergency${location?.text ? ` - ${location.text}` : ''}. Report immediately!`,
                    'emergency_assigned',
                    emergency.id,
                    'emergency'
                );
            }

            const techNames = availableTechnicians.map(t => t.user.name).join(', ');
            assignmentMessage = `Auto-assigned to: ${techNames}`;

            // Create audit log for assignments
            await prisma.auditLog.create({
                data: {
                    userId: availableTechnicians[0].userId,
                    action: 'EMERGENCY_AUTO_ASSIGNED',
                    details: `Emergency ${emergency.id} (${type}) auto-assigned to ${techNames}`
                }
            });
        } else {
            assignmentMessage = `⚠️ NO AVAILABLE STAFF - Manual intervention required`;
        }

        // Notify admins with assignment info
        for (const admin of admins) {
            await createNotification(
                admin.id,
                '🚨 EMERGENCY ALERT 🚨',
                `${type} Emergency${location?.text ? ` at ${location.text}` : ''}. ${assignmentMessage}`,
                'emergency_alert',
                emergency.id,
                'emergency'
            );
        }

        // If no technicians available, also notify security/all staff as escalation
        if (availableTechnicians.length === 0) {
            const allTechnicians = await prisma.technician.findMany({
                where: {
                    user: { isActive: true }
                },
                include: { user: true },
                take: 5 // Escalate to 5 staff members
            });

            for (const tech of allTechnicians) {
                await createNotification(
                    tech.userId,
                    '🚨 EMERGENCY ESCALATION - ALL STAFF ALERT',
                    `${type} Emergency${location?.text ? ` - ${location.text}` : ''}. No assigned staff available. Immediate assistance needed!`,
                    'emergency_escalation',
                    emergency.id,
                    'emergency'
                );
            }
        }

        res.status(201).json({
            ...emergency,
            assignedTechnicians: availableTechnicians.length,
            message: assignmentMessage
        });

    } catch (error: any) {
        console.error('Create emergency error:', error);
        res.status(500).json({ message: 'Failed to report emergency', error: error.message });
    }
};

export const getActiveEmergencies = async (req: Request, res: Response) => {
    try {
        const emergencies = await prisma.emergency.findMany({
            where: {
                status: {
                    in: ['triggered', 'responding']
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
        const { status } = req.body; // responding, resolved

        // Ensure id is a string
        const emergencyId = Array.isArray(id) ? id[0] : id;

        const data: any = { status };
        if (status === 'responding') {
            data.respondedAt = new Date();
        } else if (status === 'resolved') {
            data.resolvedAt = new Date();
        }

        const emergency = await prisma.emergency.update({
            where: { id: emergencyId },
            data
        });

        // Audit Log
        const adminId = (req as any).user?.id;
        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: `EMERGENCY_${status.toUpperCase()}`,
                    details: `Emergency ${emergencyId} status updated to ${status}`
                }
            });
        }

        res.json(emergency);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update emergency', error: error.message });
    }
};
