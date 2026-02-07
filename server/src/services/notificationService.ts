import prisma from '../db/prisma';

export const createNotification = async (
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedComplaintId?: string
) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                relatedComplaintId
            }
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

export const getUserNotifications = async (userId: string) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        return notifications;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

export const markAsRead = async (notificationId: string) => {
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};
