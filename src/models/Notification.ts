import mongoose, { Schema, model, models } from 'mongoose';

const NotificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['event_rsvp', 'event_update', 'bid_received', 'bid_accepted', 'post_comment', 'post_like', 'follower'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        default: '🔔',
    },
    actionUrl: {
        type: String,
    },
    relatedId: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    relatedType: {
        type: String,
        enum: ['event', 'product', 'post', 'user'],
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// Index for efficient querying
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, createdAt: -1 });

export default models.Notification || model('Notification', NotificationSchema);
