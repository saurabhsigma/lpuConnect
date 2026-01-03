"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, X, Save, Trash2, Shield, UserMinus, Ban } from "lucide-react";
import clsx from "clsx";
import ChannelItem from '@/components/ChannelItem';
import MembersList from "@/components/server/MembersList";
import InviteManager from "@/components/server/InviteManager";
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

            {/* Rules Acceptance Modal */}
            {server.rules && member && !member.rulesAccepted && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-border text-center">
                            <h2 className="text-2xl font-bold mb-2">Welcome to {server.name}</h2>
                            <p className="text-muted-foreground text-sm">You must accept the rules to join the conversation.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-secondary/5 prose prose-sm dark:prose-invert max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm">{server.rules}</pre>
                        </div>
                        <div className="p-6 border-t border-border flex flex-col gap-3">
                            <button 
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`/api/servers/${serverId}/rules/accept`, { method: "POST" });
                                        if (res.ok) fetchServerDetails();
                                    } catch (e) { console.error(e); }
                                }}
                                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            >
                                I Accept the Rules
                            </button>
                             <button 
                                onClick={() => router.push('/community')}
                                className="w-full text-muted-foreground hover:text-foreground text-sm"
                            >
                                Decline and Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <ServerSettingsModal 
                    server={server} 
                    onClose={() => setShowSettings(false)} 
                    onUpdate={() => { fetchServerDetails(); setShowSettings(false); }}
                    canManage={canManage}
                />
            )}
        </div>
    );
}

function ServerSettingsModal({ server, onClose, onUpdate, canManage }: any) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");

    // Overview State
    const [name, setName] = useState(server.name);
    const [rules, setRules] = useState(server.rules || "");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/servers/${server._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, rules }),
            });
            if (res.ok) {
                onUpdate();
                alert("Settings saved!");
            } else {
                alert("Failed to update server");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this server? This action cannot be undone.")) return;
         try {
            const res = await fetch(`/api/servers/${server._id}`, { method: "DELETE" });
            if (res.ok) router.push("/community");
            else alert("Failed to delete server");
        } catch (error) { console.error(error); }
    };
    
    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this server?")) return;
        try {
            const res = await fetch(`/api/servers/${server._id}/leave`, { method: "DELETE" });
            if (res.ok) router.push("/community");
            else {
                const data = await res.json();
                alert(data.message || "Failed to leave");
            }
        } catch (error) { console.error(error); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex overflow-hidden animate-in fade-in zoom-in-95">
                {/* Sidebar */}
                <div className="w-48 bg-secondary/10 border-r border-border p-4 flex flex-col gap-1">
                    <h2 className="font-bold text-sm uppercase text-muted-foreground mb-2 px-2">Settings</h2>
                    {['overview', 'members', 'invites'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "text-left px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                                activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                    
                    <div className="mt-auto pt-4 border-t border-border">
                        <button 
                            onClick={handleLeave}
                            className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                        >
                            <LogOut size={16} /> Leave Server
                        </button>
                    </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold capitalize">{activeTab}</h2>
                        <button onClick={onClose}><X size={20} className="text-muted-foreground hover:text-foreground" /></button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Server Name</label>
                                <input 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Community Rules</label>
                                <textarea 
                                    value={rules}
                                    onChange={(e) => setRules(e.target.value)}
                                    className="w-full h-32 bg-input border border-border rounded-md px-3 py-2 text-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
                                    placeholder="Set guidelines for your community..."
                                />
                            </div>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                                {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                            </button>
                            
                            <div className="pt-8 mt-8 border-t border-border">
                                <h3 className="font-bold text-red-500 mb-2">Danger Zone</h3>
                                <button 
                                    onClick={handleDelete}
                                    className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 size={16} /> Delete Server
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && <MembersList serverId={server._id} canManage={canManage} />}
                    {activeTab === 'invites' && <InviteManager serverId={server._id} />}

                </div>
            </div>
        </div>
    );
}
