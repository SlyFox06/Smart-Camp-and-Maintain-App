import { supabase } from '../db/supabase';

export const createNotification = async (
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedComplaintId?: string
) => {
    try {
        const { data, error } = await supabase.from('notifications').insert({
            user_id: userId,
            type,
            title,
            message,
            related_complaint_id: relatedComplaintId,
            is_read: false
        }).select().single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export const getUserNotifications = async (userId: string) => {
    const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    // Transform to camelCase if needed, but simple object is usually fine
    // Or we can assume frontend uses camelCase so we should map
    return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedComplaintId: n.related_complaint_id,
        read: n.is_read, // Prisma used 'read', Supa uses 'is_read'
        createdAt: n.created_at
    }));
};

export const markAsRead = async (notificationId: string) => {
    const { data } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();
    return data;
};

export const markAllAsRead = async (userId: string) => {
    const { data } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .select();
    return data;
};
