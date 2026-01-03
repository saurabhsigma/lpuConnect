"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Hash, Volume2, Video, Settings, UserPlus, Shield } from "lucide-react";
import clsx from "clsx";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const serverId = params?.serverId as string;

    const [server, setServer] = useState<any>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (serverId) fetchServerDetails();
    }, [serverId]);

    const fetchServerDetails = async () => {
        try {
            const res = await fetch(`/api/servers/${serverId}`);
            if (res.ok) {
                const data = await res.json();
                setServer(data.server);
                setChannels(data.channels);
            } else {
                router.push("/community"); // Redirect if invalid
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Server...</div>;
    if (!server) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Server Sidebar */}
            <div className="w-64 bg-secondary/5 border-r border-border flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border hover:bg-secondary/10 transition-colors cursor-pointer group">
                    <h1 className="font-bold text-lg truncate">{server.name}</h1>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {/* Text Channels */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1 flex justify-between items-center group">
                            Text Channels
                        </h3>
                        <div className="space-y-0.5">
                            {channels.filter(c => c.type === 'TEXT').map(channel => (
                                <ChannelItem key={channel._id} channel={channel} serverId={serverId} />
                            ))}
                        </div>
                    </div>

                    {/* Voice Channels */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1">Voice Channels</h3>
                        <div className="space-y-0.5">
                            {channels.filter(c => c.type !== 'TEXT').map(channel => (
                                <ChannelItem key={channel._id} channel={channel} serverId={serverId} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* User User Bar (Mini) */}
                <div className="p-3 bg-secondary/10 border-t border-border flex items-center gap-2">
                    <div className="text-xs">
                        <div className="font-bold">You</div>
                        <div className="text-muted-foreground">Online</div>
                    </div>
                </div>
            </div>

            {/* Main Content (Chat or Voice) */}
            <div className="flex-1 flex flex-col bg-background">
                {children}
            </div>
        </div>
    );
}

function ChannelItem({ channel, serverId }: { channel: any, serverId: string }) {
    const params = useParams();
    const isActive = params?.channelId === channel._id;

    return (
        <Link 
            href={`/community/${serverId}/${channel._id}`}
            className={clsx(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                isActive ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-secondary/10 hover:text-foreground"
            )}
        >
            {channel.type === 'TEXT' && <Hash size={16} />}
            {channel.type === 'AUDIO' && <Volume2 size={16} />}
            {channel.type === 'VIDEO' && <Video size={16} />}
            <span className="truncate">{channel.name}</span>
        </Link>
    );
}
