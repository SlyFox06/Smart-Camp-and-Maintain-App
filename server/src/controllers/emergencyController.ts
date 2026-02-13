
import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { createNotification } from '../services/notificationService';

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

        // Notify Admins immediately
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        for (const admin of admins) {
            await createNotification(
                admin.id,
                '🚨 EMERGENCY ALERT 🚨',
                `${type} Emergency at ${location?.building || 'Unknown Location'}`,
                'emergency_alert',
                emergency.id,
                'emergency'
            );
        }

        // Notify Security/Technicians if needed (Assuming Technicians handle specific emergencies)
        // For MVP, alerting Admins is key.

        res.status(201).json(emergency);

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

        const data: any = { status };
        if (status === 'responding') {
            data.respondedAt = new Date();
        } else if (status === 'resolved') {
            data.resolvedAt = new Date();
        }

        const emergency = await prisma.emergency.update({
            where: { id },
            data
        });

        // Audit Log
        const adminId = (req as any).user?.id;
        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: `EMERGENCY_${status.toUpperCase()}`,
                    details: `Emergency ${id} status updated to ${status}`
                }
            });
        }

        res.json(emergency);
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update emergency', error: error.message });
    }
};
