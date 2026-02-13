import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { autoAssignPendingTasks } from './cleanerController';

// Get all cleaning tasks with filters
export const getAllCleaningTasks = async (req: Request, res: Response) => {
    try {
        const { status, date, cleanerId } = req.query;

        const whereClause: any = {};

        if (status) {
            whereClause.status = status;
        }

        if (date) {
            whereClause.scheduledDate = new Date(date as string);
        }

        if (cleanerId) {
            whereClause.cleanerId = cleanerId;
        }

        const tasks = await prisma.cleaningTask.findMany({
            where: whereClause,
            include: {
                classroom: true,
                cleaner: {
                    include: {
                        user: {
                            select: { name: true, email: true }
                        }
                    }
                }
            },
            orderBy: [
                { scheduledDate: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json(tasks);
    } catch (error: any) {
        console.error('Get cleaning tasks error:', error);
        res.status(500).json({ message: 'Failed to fetch cleaning tasks', error: error.message });
    }
};

// Generate daily cleaning tasks for all classrooms
export const generateDailyTasks = async (req: Request, res: Response) => {
    try {
        const { date } = req.body;
        const scheduledDate = date ? new Date(date) : new Date();
        const userId = (req as any).user?.id;

        // Get all classrooms
        const classrooms = await prisma.classroom.findMany({
            where: { status: 'operational' }
        });

        const tasksCreated = [];
        const tasksSkipped = [];

        for (const classroom of classrooms) {
            // Check if task already exists for this classroom on this date
            const existingTask = await prisma.cleaningTask.findUnique({
                where: {
                    classroomId_scheduledDate: {
                        classroomId: classroom.id,
                        scheduledDate
                    }
                }
            });

            if (existingTask) {
                tasksSkipped.push(classroom.name);
                continue;
            }

            // Create new task
            const task = await prisma.cleaningTask.create({
                data: {
                    classroomId: classroom.id,
                    scheduledDate,
                    status: 'pending_assignment'
                },
                include: {
                    classroom: true
                }
            });

            tasksCreated.push(task);

            // Try to auto-assign immediately
            await autoAssignTask(task.id);
        }

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLEANING_TASKS_GENERATED',
                    details: `Generated ${tasksCreated.length} cleaning tasks for ${scheduledDate.toDateString()}`
                }
            });
        }

        res.json({
            message: `Generated ${tasksCreated.length} tasks, ${tasksSkipped.length} already existed`,
            tasksCreated: tasksCreated.length,
            tasksSkipped: tasksSkipped.length
        });
    } catch (error: any) {
        console.error('Generate daily tasks error:', error);
        res.status(500).json({ message: 'Failed to generate daily tasks', error: error.message });
    }
};

// Auto-assign a specific task
export const autoAssignTask = async (taskId: string) => {
    try {
        const task = await prisma.cleaningTask.findUnique({
            where: { id: taskId },
            include: { classroom: true }
        });

        if (!task || task.cleanerId) {
            return false;
        }

        // Find available cleaner for this classroom's building
        const availableCleaner = await prisma.cleaner.findFirst({
            where: {
                assignedArea: task.classroom.building,
                isAvailable: true
            },
            orderBy: {
                lastAvailabilityUpdate: 'asc' // Assign to cleaner who has been available longest
            }
        });

        if (availableCleaner) {
            await prisma.cleaningTask.update({
                where: { id: taskId },
                data: {
                    cleanerId: availableCleaner.id,
                    status: 'assigned',
                    assignedAt: new Date()
                }
            });
            console.log(`✅ Auto-assigned task ${taskId} to cleaner ${availableCleaner.id}`);
            return true;
        } else {
            // No available cleaner, mark as waiting
            await prisma.cleaningTask.update({
                where: { id: taskId },
                data: {
                    status: 'waiting_for_availability'
                }
            });
            console.log(`⏳ Task ${taskId} waiting for available cleaner`);
            return false;
        }
    } catch (error) {
        console.error('Auto-assign task error:', error);
        return false;
    }
};

// Manual assignment by admin
export const manualAssignTask = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { cleanerId } = req.body;
        const userId = (req as any).user?.id;

        const task = await prisma.cleaningTask.update({
            where: { id: taskId },
            data: {
                cleanerId,
                status: 'assigned',
                assignedAt: new Date()
            },
            include: {
                classroom: true,
                cleaner: {
                    include: {
                        user: true
                    }
                }
            }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLEANING_TASK_MANUALLY_ASSIGNED',
                    details: `Assigned ${task.classroom.name} cleaning to ${task.cleaner?.user.name}`
                }
            });
        }

        res.json(task);
    } catch (error: any) {
        console.error('Manual assign task error:', error);
        res.status(500).json({ message: 'Failed to assign task', error: error.message });
    }
};

// Update task status
export const updateTaskStatus = async (req: Request, res: Response) => {
    try {
        const { taskId } = req.params;
        const { status, notes } = req.body;
        const userId = (req as any).user?.id;

        const updateData: any = { status };

        if (status === 'completed') {
            updateData.completedAt = new Date();
        }

        if (notes) {
            updateData.notes = notes;
        }

        const task = await prisma.cleaningTask.update({
            where: { id: taskId },
            data: updateData,
            include: {
                classroom: true,
                cleaner: {
                    include: { user: true }
                }
            }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLEANING_TASK_STATUS_UPDATED',
                    details: `${task.classroom.name} cleaning marked as ${status}`
                }
            });
        }

        res.json(task);
    } catch (error: any) {
        console.error('Update task status error:', error);
        res.status(500).json({ message: 'Failed to update task status', error: error.message });
    }
};

// Get task statistics
export const getTaskStatistics = async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date as string) : new Date();

        const stats = await prisma.cleaningTask.groupBy({
            by: ['status'],
            where: {
                scheduledDate: targetDate
            },
            _count: true
        });

        const formattedStats = stats.reduce((acc: any, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {});

        res.json({
            date: targetDate,
            statistics: formattedStats,
            total: stats.reduce((sum, stat) => sum + stat._count, 0)
        });
    } catch (error: any) {
        console.error('Get task statistics error:', error);
        res.status(500).json({ message: 'Failed to fetch task statistics', error: error.message });
    }
};
