"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, X, Check, CheckCheck } from "lucide-react";
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

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchNotifications();

        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            const res = await fetch("/api/notifications?limit=5");
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                title="Notifications"
            >
                <Bell size={20} className="text-foreground group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 max-h-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border p-4 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors flex items-center gap-1"
                            >
                                <CheckCheck size={14} /> Mark all
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto max-h-80">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <div className="animate-pulse">Loading...</div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map(notification => (
                                    <div
                                        key={notification._id}
                                        className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer group ${!notification.read ? 'bg-primary/5' : ''}`}
                                    >
                                        <Link href={notification.actionUrl} onClick={() => setIsOpen(false)}>
                                            <div className="flex gap-3">
                                                {/* Icon */}
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${getTypeColor(notification.type)} flex items-center justify-center text-lg`}>
                                                    {notification.icon}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/50 mt-2">
                                                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>

                                                {/* Mark as read button */}
                                                {!notification.read && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            markAsRead(notification._id);
                                                        }}
                                                        className="flex-shrink-0 p-1 rounded hover:bg-primary/20 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} className="text-primary" />
                                                    </button>
                                                )}
                                            </div>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-border p-3 text-center">
                            <Link
                                href="/notifications"
                                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                onClick={() => setIsOpen(false)}
                            >
                                View all notifications →
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
