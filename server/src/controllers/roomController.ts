import { Request, Response } from 'express';
import prisma from '../db/prisma';

export const getAllRooms = async (req: Request, res: Response) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                complaints: {
                    where: { status: { in: ['reported', 'assigned', 'in_progress'] } }
                }
            },
            orderBy: [
                { hostelName: 'asc' },
                { block: 'asc' },
                { floor: 'asc' },
                { roomNumber: 'asc' }
            ]
        });

        res.json(rooms);
    } catch (error: any) {
        console.error('Get rooms error:', error);
        res.status(500).json({ message: 'Failed to fetch rooms', error: error.message });
    }
};

export const getRoomById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                complaints: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error: any) {
        console.error('Get room error:', error);
        res.status(500).json({ message: 'Failed to fetch room', error: error.message });
    }
};

export const createRoom = async (req: Request, res: Response) => {
    try {
        const { roomNumber, block, floor, hostelName, capacity } = req.body;
        const userId = (req as any).user?.id;

        const room = await prisma.room.create({
            data: {
                roomNumber,
                block,
                floor,
                hostelName,
                capacity,
                status: 'operational'
            }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ROOM_CREATED',
                    details: `Created room: ${hostelName} - ${block} - ${roomNumber}`
                }
            });
        }

        res.status(201).json(room);
    } catch (error: any) {
        console.error('Create room error:', error);
        res.status(500).json({ message: 'Failed to create room', error: error.message });
    }
};

export const updateRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const updateData = req.body;
        const userId = (req as any).user?.id;

        const room = await prisma.room.update({
            where: { id },
            data: updateData
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ROOM_UPDATED',
                    details: `Updated room: ${room.hostelName} - ${room.block} - ${room.roomNumber}`
                }
            });
        }

        res.json(room);
    } catch (error: any) {
        console.error('Update room error:', error);
        res.status(500).json({ message: 'Failed to update room', error: error.message });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const userId = (req as any).user?.id;

        const room = await prisma.room.delete({
            where: { id }
        });

        if (userId) {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action: 'ROOM_DELETED',
                    details: `Deleted room: ${room.hostelName} - ${room.block} - ${room.roomNumber}`
                }
            });
        }

        res.json({ message: 'Room deleted successfully', room });
    } catch (error: any) {
        console.error('Delete room error:', error);
        res.status(500).json({ message: 'Failed to delete room', error: error.message });
    }
};

export const getRoomByQR = async (req: Request, res: Response) => {
    try {
        const { qrUrl } = req.params as { qrUrl: string };
        const room = await prisma.room.findFirst({
            where: { qrUrl }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error: any) {
        console.error('Get room by QR error:', error);
        res.status(500).json({ message: 'Failed to fetch room', error: error.message });
    }
};

export const getActiveComplaint = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        const complaint = await prisma.complaint.findFirst({
            where: {
                roomId: id,
                status: {
                    in: ['reported', 'assigned', 'in_progress', 'verified']
                }
            },
            include: {
                student: true
            }
        });

        res.json(complaint || null);
    } catch (error: any) {
        console.error('Check active complaint error:', error);
        res.status(500).json({ message: 'Failed to check active complaint', error: error.message });
    }
};
