import { Request, Response } from 'express';
import prisma from '../db/prisma';

export const getAllClassrooms = async (req: Request, res: Response) => {
    try {
        const { department } = req.query;
        const whereClause: any = {};

        if (department) {
            whereClause.department = department;
        }

        const classrooms = await prisma.classroom.findMany({
            where: whereClause,
            include: {
                complaints: {
                    where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
                }
            },
            orderBy: [
                { building: 'asc' },
                { floor: 'asc' },
                { roomNumber: 'asc' }
            ]
        });

        res.json(classrooms);
    } catch (error: any) {
        console.error('Get classrooms error:', error);
        res.status(500).json({ message: 'Failed to fetch classrooms', error: error.message });
    }
};

export const getClassroomById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const classroom = await prisma.classroom.findUnique({
            where: { id },
            include: {
                complaints: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!classroom) {
            return res.status(404).json({ message: 'Classroom not found' });
        }

        res.json(classroom);
    } catch (error: any) {
        console.error('Get classroom error:', error);
        res.status(500).json({ message: 'Failed to fetch classroom', error: error.message });
    }
};

export const createClassroom = async (req: Request, res: Response) => {
    try {
        const { name, building, floor, roomNumber, department, capacity, type } = req.body;
        const userId = (req as any).user?.id;

        const classroom = await prisma.classroom.create({
            data: {
                name,
                building,
                floor,
                roomNumber,
                department,
                capacity,
                type,
                status: 'operational'
            }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLASSROOM_CREATED',
                    details: `Created classroom: ${name} (${building} - ${roomNumber})`
                }
            });
        }

        res.status(201).json(classroom);
    } catch (error: any) {
        console.error('Create classroom error:', error);
        res.status(500).json({ message: 'Failed to create classroom', error: error.message });
    }
};

export const updateClassroom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const updateData = req.body;
        const userId = (req as any).user?.id;

        const classroom = await prisma.classroom.update({
            where: { id },
            data: updateData
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLASSROOM_UPDATED',
                    details: `Updated classroom: ${classroom.name}`
                }
            });
        }

        res.json(classroom);
    } catch (error: any) {
        console.error('Update classroom error:', error);
        res.status(500).json({ message: 'Failed to update classroom', error: error.message });
    }
};

export const deleteClassroom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user?.id;

        const classroom = await prisma.classroom.delete({
            where: { id }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'CLASSROOM_DELETED',
                    details: `Deleted classroom: ${classroom.name}`
                }
            });
        }

        res.json({ message: 'Classroom deleted successfully', classroom });
    } catch (error: any) {
        console.error('Delete classroom error:', error);
        res.status(500).json({ message: 'Failed to delete classroom', error: error.message });
    }
};
