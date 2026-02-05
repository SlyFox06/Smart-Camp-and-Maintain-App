import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    relatedComplaintId?: string;
    createdAt: string;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            setUnreadCount(response.data.filter((n: Notification) => !n.read).length);
            setIsLoading(false);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    }, []);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await api.put(`/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed to mark notification as read', error);
            // Revert on failure (could implement fetching again)
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            await api.put('/notifications/read-all');
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    };
};
