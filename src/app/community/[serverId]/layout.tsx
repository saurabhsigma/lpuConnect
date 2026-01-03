"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import ChannelItem from '@/components/ChannelItem';
import ServerSettingsModal from '@/components/SettingServer'
import { useSession } from "next-auth/react";

export default function ServerLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const serverId = params?.serverId as string;

    const [server, setServer] = useState<any>(null);
    const [channels, setChannels] = useState<any[]>([]);
    const [member, setMember] = useState<any>(null); 
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

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
                setMember(data.member);
            } else {
                router.push("/community"); // Redirect if invalid
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Server...</div>;
    if (!server) return null;

    // Permission Check
    const isOwner = session?.user?.id === server.ownerId;
    
    let isAdmin = false;
    if (member && server && member.roles) {
        const adminRole = server.roles.find((r: any) => r.name === "Admin");
        if (adminRole && member.roles.includes(adminRole._id)) {
            isAdmin = true;
        }
    }

    const canManage = isOwner || isAdmin;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* Server Sidebar */}
            <div className="w-64 bg-secondary/5 border-r border-border flex flex-col shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-border hover:bg-secondary/10 transition-colors flex justify-between items-center group">
                    <h1 className="font-bold text-lg truncate">{server.name}</h1>
                    {canManage && (
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-background/50"
                            title="Server Settings"
                        >
                            <Settings size={18} />
                        </button>
                    )}
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                    {/* Text Channels */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1 flex justify-between items-center group">
                            Text Channels
                        </h3>
                        <div className="space-y-0.5">
                            {channels.filter(c => c.type === 'text').map(channel => (
                                <ChannelItem key={channel._id} channel={channel} serverId={serverId} />
                            ))}
                        </div>
                    </div>

                    {/* Voice Channels */}
                    <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-1">Voice Channels</h3>
                        <div className="space-y-0.5">
                            {channels.filter(c => c.type !== 'text').map(channel => (
                                <ChannelItem key={channel._id} channel={channel} serverId={serverId} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* User User Bar (Mini) */}
                <div className="p-3 bg-secondary/10 border-t border-border flex items-center gap-2">
                    <div className="text-xs">
                        <div className="font-bold">{session?.user?.name || "You"}</div>
                        <div className="text-muted-foreground">Online</div>
                    </div>
                </div>
            </div>

            {/* Main Content (Chat or Voice) */}
            <div className="flex-1 flex flex-col bg-background min-w-0">
                {children}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <ServerSettingsModal 
                    server={server} 
                    onClose={() => setShowSettings(false)} 
                    onUpdate={() => { fetchServerDetails(); setShowSettings(false); }}
                />
            )}
        </div>
    );
}



