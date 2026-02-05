import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

export const getNotifications = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        const notifications = await notificationService.getUserNotifications(userId);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
};

export const markNotificationRead = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await notificationService.markAsRead(id as string);
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notification', error });
    }
};

export const markAllRead = async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    try {
        await notificationService.markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notifications', error });
    }
};
