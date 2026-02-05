import { prisma } from '../db/prisma';

export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedComplaintId?: string
) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                relatedComplaintId,
            },
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const getUserNotifications = async (userId: string) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

export const markAsRead = async (notificationId: string) => {
    return await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
    });
};

export const markAllAsRead = async (userId: string) => {
    return await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
    });
};
