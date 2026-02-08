import { Request, Response } from 'express';
import { getUserNotifications, markAsRead } from '../services/notificationService';
import prisma from '../db/prisma';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const notifications = await getUserNotifications(userId);
        res.json(notifications);
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string };
        await markAsRead(id);
        res.json({ message: 'Notification marked as read' });
    } catch (error: any) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ message: 'Failed to mark notification as read', error: error.message });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Mark all read error:', error);
        res.status(500).json({ message: 'Failed to mark all as read', error: error.message });
    }
};
