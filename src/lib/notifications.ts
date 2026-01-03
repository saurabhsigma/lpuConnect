import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";

export interface CreateNotificationParams {
    userId: string;
    type: 'event_rsvp' | 'event_update' | 'bid_received' | 'bid_accepted' | 'post_comment' | 'post_like' | 'follower';
    title: string;
    message: string;
    icon?: string;
    actionUrl: string;
    relatedId: string;
    relatedType: 'event' | 'product' | 'post' | 'user';
}

export async function createNotification(params: CreateNotificationParams) {
    try {
        await dbConnect();

        const notification = await Notification.create({
            userId: params.userId,
            type: params.type,
            title: params.title,
            message: params.message,
            icon: params.icon || '🔔',
            actionUrl: params.actionUrl,
            relatedId: params.relatedId,
            relatedType: params.relatedType,
        });

        return notification;
    } catch (error) {
        console.error("Create notification error:", error);
        throw error;
    }
}

export async function getUnreadCount(userId: string) {
    try {
        await dbConnect();

        const count = await Notification.countDocuments({
            userId,
            read: false,
        });

        return count;
    } catch (error) {
        console.error("Get unread count error:", error);
        return 0;
    }
}
