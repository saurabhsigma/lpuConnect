"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import Link from "next/link";

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    icon: string;
    actionUrl: string;
    relatedType: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (status === "authenticated") {
            fetchNotifications();
        }
    }, [status]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=50");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications?id=${notificationId}`, { method: "PATCH" });
            await fetchNotifications();
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
            if (unreadIds.length > 0) {
                await fetch("/api/notifications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notificationIds: unreadIds }),
                });
                await fetchNotifications();
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'event_rsvp': return 'from-orange-500 to-red-500';
            case 'event_update': return 'from-blue-500 to-cyan-500';
            case 'bid_received': return 'from-green-500 to-emerald-500';
            case 'bid_accepted': return 'from-purple-500 to-pink-500';
            case 'post_comment': return 'from-indigo-500 to-purple-500';
            case 'post_like': return 'from-pink-500 to-red-500';
            case 'follower': return 'from-yellow-500 to-orange-500';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.read)
        : notifications;

    if (status === "unauthenticated") {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Please sign in to view notifications</p>
                    <Link href="/auth/signin" className="text-primary hover:underline">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="relative px-4 md:px-8 pt-8 pb-12 md:pt-16 md:pb-20 bg-gradient-to-br from-blue-500/10 via-background to-purple-500/10 border-b border-border">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                            <Bell className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Notifications
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">Stay updated with events, bids, comments, and more</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12">
                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                filter === 'all'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                filter === 'unread'
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all flex items-center gap-2 font-medium"
                        >
                            <CheckCheck size={16} /> Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                {loading ? (
                    <div className="text-center py-16">
                        <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-3xl border-2 border-dashed border-border/50">
                        <Bell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
                        <p className="text-foreground font-semibold text-lg mb-2">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                        <p className="text-muted-foreground">
                            {filter === 'unread'
                                ? 'You are all caught up!'
                                : 'Stay engaged with events, bids, and community activities'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map(notification => (
                            <Link
                                key={notification._id}
                                href={notification.actionUrl}
                                className={`glass-card p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group cursor-pointer block ${
                                    !notification.read
                                        ? 'bg-primary/5 border-primary/20'
                                        : 'border-border/50'
                                }`}
                            >
                                <div className="flex gap-4">
                                    {/* Icon */}
                                    <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${getTypeColor(notification.type)} flex items-center justify-center text-2xl`}>
                                        {notification.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.read && (
                                                        <span className="w-3 h-3 rounded-full bg-primary animate-pulse flex-shrink-0" />
                                                    )}
                                                </div>
                                                <p className="text-muted-foreground mb-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground/50">
                                                    {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        markAsRead(notification._id);
                                                    }}
                                                    className="flex-shrink-0 px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all text-sm font-medium"
                                                >
                                                    Mark as read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
