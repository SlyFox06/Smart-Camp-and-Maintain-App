import { Request, Response } from 'express';
import prisma from '../db/prisma';

// Get all cleaners with their current tasks
export const getAllCleaners = async (req: Request, res: Response) => {
    try {
        const cleaners = await prisma.cleaner.findMany({
            include: {
                user: {
                    select: { id: true, name: true, email: true, phone: true, isActive: true }
                },
                cleaningTasks: {
                    where: {
                        status: { in: ['assigned', 'in_progress'] }
                    },
                    include: {
                        classroom: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(cleaners);
    } catch (error: any) {
        console.error('Get cleaners error:', error);
        res.status(500).json({ message: 'Failed to fetch cleaners', error: error.message });
    }
};

// Update cleaner availability
export const updateAvailability = async (req: Request, res: Response) => {
    try {
        const { cleanerId } = req.params;
        const { isAvailable } = req.body;
        const userId = (req as any).user?.id;

        const cleaner = await prisma.cleaner.update({
            where: { id: cleanerId },
            data: {
                isAvailable,
                lastAvailabilityUpdate: new Date()
            },
            include: {
                user: true
            }
        });

        // Log the change
        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLEANER_AVAILABILITY_UPDATED',
                    details: `${cleaner.user.name} availability set to ${isAvailable ? 'Available' : 'Unavailable'}`
                }
            });
        }

        // If cleaner becomes available, trigger auto-assignment
        if (isAvailable) {
            await autoAssignPendingTasks(cleanerId);

            // Also retry waiting complaint assignments
            const { retryWaitingAssignments } = require('../services/autoAssignmentService');
            await retryWaitingAssignments(cleaner.userId, 'cleaner');
        }

        res.json(cleaner);
    } catch (error: any) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Failed to update availability', error: error.message });
    }
};

// Auto-assign pending tasks to an available cleaner
export const autoAssignPendingTasks = async (cleanerId: string) => {
    try {
        const cleaner = await prisma.cleaner.findUnique({
            where: { id: cleanerId },
            select: { assignedArea: true, isAvailable: true }
        });

        if (!cleaner || !cleaner.isAvailable) {
            return;
        }

        // Find pending tasks for classrooms in this cleaner's area
        const pendingTasks = await prisma.cleaningTask.findMany({
            where: {
                status: { in: ['pending_assignment', 'waiting_for_availability'] },
                classroom: {
                    building: cleaner.assignedArea
                }
            },
            include: {
                classroom: true
            },
            orderBy: { scheduledDate: 'asc' }
        });

        // Assign tasks
        for (const task of pendingTasks) {
            await prisma.cleaningTask.update({
                where: { id: task.id },
                data: {
                    cleanerId,
                    status: 'assigned',
                    assignedAt: new Date()
                }
            });

            console.log(`✅ Auto-assigned task ${task.id} to cleaner ${cleanerId}`);
        }

        return pendingTasks.length;
    } catch (error) {
        console.error('Auto-assign error:', error);
        return 0;
    }
};

// Create a new cleaner
export const createCleaner = async (req: Request, res: Response) => {
    try {
        const { userId, assignedArea } = req.body;
        const adminId = (req as any).user?.id;

        const cleaner = await prisma.cleaner.create({
            data: {
                userId,
                assignedArea,
                isAvailable: true
            },
            include: {
                user: true
            }
        });

        if (adminId) {
            await prisma.auditLog.create({
                data: {
                    userId: adminId,
                    action: 'CLEANER_CREATED',
                    details: `Created cleaner: ${cleaner.user.name} for area ${assignedArea}`
                }
            });
        }

        res.status(201).json(cleaner);
    } catch (error: any) {
        console.error('Create cleaner error:', error);
        res.status(500).json({ message: 'Failed to create cleaner', error: error.message });
    }
};

// Get cleaner by user ID (for cleaner dashboard)
export const getCleanerByUserId = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const cleaner = await prisma.cleaner.findUnique({
            where: { userId },
            include: {
                user: true,
                cleaningTasks: {
                    include: {
                        classroom: true
                    },
                    orderBy: { scheduledDate: 'desc' },
                    take: 50
                }
            }
        });

        if (!cleaner) {
            return res.status(404).json({ message: 'Cleaner profile not found' });
        }

        res.json(cleaner);
    } catch (error: any) {
        console.error('Get cleaner by user ID error:', error);
        res.status(500).json({ message: 'Failed to fetch cleaner data', error: error.message });
    }
};
