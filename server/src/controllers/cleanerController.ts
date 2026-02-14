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
                        classroom: true,
                        room: true
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

        // Logic for Availability Change
        if (isAvailable) {
            // 1. If becoming available, assign pending tasks
            await autoAssignPendingTasks(cleanerId);

            // 2. Also retry waiting complaint assignments
            try {
                const { retryWaitingAssignments } = require('../services/autoAssignmentService');
                if (retryWaitingAssignments) {
                    await retryWaitingAssignments(cleaner.userId, 'cleaner');
                }
            } catch (e) {
                console.warn('Auto-assignment service not found or failed', e);
            }
        } else {
            // 3. If becoming unavailable, REDISTRIBUTE assigned tasks to others
            await redistributeTasks(cleanerId);
        }

        res.json(cleaner);
    } catch (error: any) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: 'Failed to update availability', error: error.message });
    }
};

// Generate daily hostel cleaning tasks
export const generateHostelTasks = async (req: Request, res: Response) => {
    try {
        const { generateDailyCleaningTasks } = await import('../services/cleanerService');
        const result = await generateDailyCleaningTasks(new Date());

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error: any) {
        console.error('Generate tasks error:', error);
        res.status(500).json({ message: 'Failed to generate tasks', error: error.message });
    }
};

// Helper: Redistribute tasks when cleaner becomes unavailable
const redistributeTasks = async (cleanerId: string) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get active tasks
        const tasks = await prisma.cleaningTask.findMany({
            where: {
                cleanerId: cleanerId,
                status: { in: ['assigned', 'waiting_for_availability'] },
                scheduledDate: { gte: today }
            },
            include: { room: true }
        });

        if (tasks.length === 0) return;

        console.log(`Redistributing ${tasks.length} tasks from cleaner ${cleanerId}...`);

        // Get Cleaner Info for area
        const currentCleaner = await prisma.cleaner.findUnique({ where: { id: cleanerId } });
        if (!currentCleaner) return;

        // Find alternates
        const alternates = await prisma.cleaner.findMany({
            where: {
                id: { not: cleanerId },
                isAvailable: true,
                assignedArea: currentCleaner.assignedArea, // Same block
                user: {
                    isActive: true
                }
            }
        });

        if (alternates.length === 0) {
            console.log('No alternates found. Setting tasks to pending.');
            await prisma.cleaningTask.updateMany({
                where: { id: { in: tasks.map(t => t.id) } },
                data: { status: 'pending_assignment', cleanerId: null, assignedAt: null }
            });
            return;
        }

        // Distribute
        let altIdx = 0;
        for (const task of tasks) {
            const newCleaner = alternates[altIdx];
            await prisma.cleaningTask.update({
                where: { id: task.id },
                data: {
                    cleanerId: newCleaner.id,
                    status: 'assigned',
                    assignedAt: new Date(),
                    notes: (task.notes ? task.notes + '\n' : '') + '[System]: Auto-reassigned due to unavailability.'
                }
            });
            altIdx = (altIdx + 1) % alternates.length;
        }
        console.log(`Redistributed tasks to ${alternates.length} alternate cleaners.`);

    } catch (error) {
        console.error('Redistribution error:', error);
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

        // Find pending tasks for classrooms OR rooms in this cleaner's area
        const pendingTasks = await prisma.cleaningTask.findMany({
            where: {
                status: { in: ['pending_assignment', 'waiting_for_availability'] },
                OR: [
                    {
                        classroom: {
                            building: cleaner.assignedArea
                        }
                    },
                    {
                        room: {
                            block: cleaner.assignedArea
                        }
                    }
                ]
            },
            include: {
                classroom: true,
                room: true
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
                user: {
                    include: {
                        technicianComplaints: {
                            where: { status: { notIn: ['closed', 'resolved'] } },
                            include: { asset: true, room: true, classroom: true, student: true }
                        }
                    }
                },
                cleaningTasks: {
                    include: {
                        classroom: true,
                        room: true
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
