"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
    MessageSquare,
    Plus,
    Settings,
    LogOut,
    ChevronDown,
    Lock,
    Globe,
    Users,
    Zap,
    Hash,
} from "lucide-react";
import Link from "next/link";

interface Server {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    visibility: 'public' | 'private';
    ownerId: string;
    inviteCode: string;
}

interface Channel {
    _id: string;
    name: string;
    type: 'text' | 'audio' | 'video';
    serverId: string;
    isPrivate: boolean;
}

export default function CommunityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServer, setSelectedServer] = useState<string | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newServerName, setNewServerName] = useState('');
    const [newServerDescription, setNewServerDescription] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        fetchServers();
    }, []);

    useEffect(() => {
        if (selectedServer) {
            fetchChannels(selectedServer);
        }
    }, [selectedServer]);

    const fetchServers = async () => {
        try {
            const res = await fetch('/api/servers');
            if (res.ok) {
                const data = await res.json();
                setServers(data);
                if (data.length > 0 && !selectedServer) {
                    setSelectedServer(data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching servers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChannels = async (serverId: string) => {
        try {
            const res = await fetch(`/api/servers/${serverId}/channels`);
            if (res.ok) {
                const data = await res.json();
                setChannels(data);
            }
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };

    const handleCreateServer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newServerName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch('/api/servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newServerName,
                    description: newServerDescription,
                }),
            });

            if (res.ok) {
                const { server, redirectUrl } = await res.json();
                setServers([...servers, server]);
                setSelectedServer(server._id);
                setNewServerName('');
                setNewServerDescription('');
                setShowCreateModal(false);
                router.push(redirectUrl);
            }
        } catch (error) {
            console.error('Error creating server:', error);
        } finally {
            setCreating(false);
        }
    };

    const currentServer = servers.find(s => s._id === selectedServer);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <MessageSquare size={40} className="text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading servers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Server List */}
            <div className="w-20 bg-background/95 border-r border-border/50 flex flex-col items-center py-4 gap-2">
                {servers.map(server => (
                    <button
                        key={server._id}
                        onClick={() => setSelectedServer(server._id)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            selectedServer === server._id
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        title={server.name}
                    >
                        {server.icon ? (
                            <img src={server.icon} alt={server.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            server.name.charAt(0).toUpperCase()
                        )}
                    </button>
                ))}
                
                {/* Create Server Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-14 h-14 rounded-full bg-muted hover:bg-primary/20 text-muted-foreground hover:text-primary flex items-center justify-center transition-all mt-2"
                    title="Create Server"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Main Area */}
            {selectedServer ? (
                <div className="flex-1 flex flex-col">
                    {/* Server Header */}
                    <div className="h-14 bg-background/50 border-b border-border/50 flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-foreground">
                                {currentServer?.name}
                            </h2>
                            {currentServer?.visibility === 'public' ? (
                                <Globe size={16} className="text-muted-foreground" />
                            ) : (
                                <Lock size={16} className="text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <Settings size={18} className="text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Channels + Chat */}
                    <div className="flex-1 flex">
                        {/* Channels Sidebar */}
                        <div className="w-56 bg-background/95 border-r border-border/50 flex flex-col overflow-hidden">
                            {/* Server Info */}
                            <div className="p-4 border-b border-border/50">
                                <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                    <Users size={16} /> Members
                                </h3>
                                <p className="text-xs text-muted-foreground">Active community</p>
                            </div>

                            {/* Channels */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-1">
                                {channels.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No channels yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Text Channels */}
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-3">TEXT CHANNELS</p>
                                            {channels
                                                .filter(c => c.type === 'text')
                                                .map(channel => (
                                                    <Link
                                                        key={channel._id}
                                                        href={`/community/${selectedServer}/${channel._id}`}
                                                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                    >
                                                        <Hash size={14} />
                                                        {channel.name}
                                                        {channel.isPrivate && <Lock size={12} />}
                                                    </Link>
                                                ))}
                                        </div>

                                        {/* Voice Channels */}
                                        {channels.some(c => c.type === 'audio' || c.type === 'video') && (
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-3">VOICE CHANNELS</p>
                                                {channels
                                                    .filter(c => c.type === 'audio' || c.type === 'video')
                                                    .map(channel => (
                                                        <Link
                                                            key={channel._id}
                                                            href={`/community/${selectedServer}/${channel._id}`}
                                                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center gap-2"
                                                        >
                                                            <Zap size={14} />
                                                            {channel.name}
                                                            {channel.isPrivate && <Lock size={12} />}
                                                        </Link>
                                                    ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* User Profile */}
                            <div className="p-3 border-t border-border/50">
                                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                            {session?.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="text-xs">
                                            <p className="font-semibold text-foreground">{session?.user?.name}</p>
                                            <p className="text-muted-foreground">#1234</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col">
                            {channels.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="text-center">
                                        <MessageSquare size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to {currentServer?.name}!</h3>
                                        <p className="text-muted-foreground max-w-sm mb-6">
                                            {currentServer?.description || 'This is the beginning of the channel. Start a conversation!'}
                                        </p>
                                        <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                                            Create First Channel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center">
                                    <MessageSquare size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">Select a Channel</h3>
                                    <p className="text-muted-foreground">Pick a channel to start chatting</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <MessageSquare size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">No Servers Yet</h2>
                        <p className="text-muted-foreground mb-6">Create or join a server to get started</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                        >
                            Create Your First Server
                        </button>
                    </div>
                </div>
            )}

            {/* Create Server Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-background rounded-2xl p-6 max-w-md w-full mx-4 border border-border">
                        <h2 className="text-2xl font-bold text-foreground mb-4">Create a Server</h2>
                        <form onSubmit={handleCreateServer} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Server Name</label>
                                <input
                                    type="text"
                                    value={newServerName}
                                    onChange={(e) => setNewServerName(e.target.value)}
                                    placeholder="e.g., My Campus"
                                    className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Description (Optional)</label>
                                <textarea
                                    value={newServerDescription}
                                    onChange={(e) => setNewServerDescription(e.target.value)}
                                    placeholder="What's this server about?"
                                    className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground resize-none"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !newServerName.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

