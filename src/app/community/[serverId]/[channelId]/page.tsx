"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
    MessageSquare,
    Settings,
    ChevronDown,
    Lock,
    Users,
    Zap,
    Hash,
    Send,
    AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Message {
    _id: string;
    content: string;
    senderId?: {
        _id: string;
        name: string;
        image?: string;
    };
    authorId?: {
        _id: string;
        name: string;
        image?: string;
    };
    channelId: string;
    createdAt: string;
}

interface Channel {
    _id: string;
    name: string;
    type: 'text' | 'audio' | 'video';
    serverId: string;
    isPrivate: boolean;
}

interface Server {
    _id: string;
    name: string;
    description?: string;
    icon?: string;
    visibility: 'public' | 'private';
    ownerId: string;
    inviteCode: string;
}

export default function ChannelPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const params = useParams();
    const serverId = params?.serverId as string;
    const channelId = params?.channelId as string;

    const [server, setServer] = useState<Server | null>(null);
    const [channel, setChannel] = useState<Channel | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (serverId && channelId) {
            fetchServerAndChannels();
            fetchMessages();
        }
    }, [serverId, channelId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const fetchServerAndChannels = async () => {
        try {
            const serverRes = await fetch(`/api/servers/${serverId}`);
            if (serverRes.ok) {
                const serverData = await serverRes.json();
                setServer(serverData);
            }

            const channelsRes = await fetch(`/api/servers/${serverId}/channels`);
            if (channelsRes.ok) {
                const channelsData = await channelsRes.json();
                setChannels(channelsData);
                const currentChannel = channelsData.find((c: Channel) => c._id === channelId);
                setChannel(currentChannel);
            }
        } catch (error) {
            console.error('Error fetching server/channels:', error);
            setError('Failed to load server');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(Array.isArray(data) ? data : data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !session) return;

        setSending(true);
        try {
            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: messageInput,
                }),
            });

            if (res.ok) {
                const newMessage = await res.json();
                setMessages([...messages, newMessage]);
                setMessageInput('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin mb-4">
                        <MessageSquare size={40} className="text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading channel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar - Server List */}
            <div className="w-20 bg-background/95 border-r border-border/50 flex flex-col items-center py-4 gap-2">
                <Link
                    href="/community"
                    className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors"
                    title="Back to Servers"
                >
                    <MessageSquare size={20} />
                </Link>
            </div>

            {/* Channels Sidebar */}
            <div className="w-56 bg-background/95 border-r border-border/50 flex flex-col">
                {/* Server Header */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-border/50">
                    <h2 className="font-bold text-foreground truncate">{server?.name}</h2>
                    <button className="p-1 hover:bg-muted rounded transition-colors">
                        <ChevronDown size={16} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {/* Text Channels */}
                    <div>
                        <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">TEXT CHANNELS</p>
                        {channels
                            .filter(c => c.type === 'text')
                            .map(ch => (
                                <Link
                                    key={ch._id}
                                    href={`/community/${serverId}/${ch._id}`}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                        channelId === ch._id
                                            ? 'bg-primary/20 text-primary'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    }`}
                                >
                                    <Hash size={14} />
                                    {ch.name}
                                    {ch.isPrivate && <Lock size={12} />}
                                </Link>
                            ))}
                    </div>

                    {/* Voice Channels */}
                    {channels.some(c => c.type === 'audio' || c.type === 'video') && (
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-3">VOICE CHANNELS</p>
                            {channels
                                .filter(c => c.type === 'audio' || c.type === 'video')
                                .map(ch => (
                                    <div
                                        key={ch._id}
                                        className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-2 cursor-not-allowed opacity-50"
                                    >
                                        <Zap size={14} />
                                        {ch.name}
                                        {ch.isPrivate && <Lock size={12} />}
                                    </div>
                                ))}
                        </div>
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

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Channel Header */}
                <div className="h-14 bg-background/50 border-b border-border/50 flex items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Hash size={18} className="text-muted-foreground" />
                        <h2 className="text-lg font-bold text-foreground">{channel?.name}</h2>
                    </div>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <Settings size={18} className="text-muted-foreground hover:text-foreground" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto flex flex-col">
                    {error && (
                        <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
                            <AlertCircle size={16} className="text-red-500" />
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <Hash size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to #{channel?.name}</h3>
                            <p className="text-muted-foreground max-w-sm">
                                This is the beginning of the channel. Start a conversation!
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-0 p-6">
                            {messages.map((message, idx) => {
                                const author = message.authorId || message.senderId;
                                const prevAuthor = idx > 0 
                                    ? (messages[idx - 1].authorId || messages[idx - 1].senderId)
                                    : null;
                                const isSameAuthor = prevAuthor && author && prevAuthor._id === author._id;

                                return (
                                    <div
                                        key={message._id}
                                        className={`group hover:bg-muted/20 p-3 rounded-lg transition-colors ${
                                            isSameAuthor ? 'mt-0.5 ml-12' : 'mt-4'
                                        }`}
                                    >
                                        {!isSameAuthor && (
                                            <div className="flex items-start gap-4 mb-1">
                                                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {author?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-foreground">
                                                            {author?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-foreground whitespace-pre-wrap break-words text-sm mt-1">
                                                        {message.content}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {isSameAuthor && (
                                            <p className="text-foreground whitespace-pre-wrap break-words text-sm">
                                                {message.content}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-border/50 p-4 bg-background/50">
                    {session ? (
                        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={`Message #${channel?.name}`}
                                className="flex-1 bg-input border border-border rounded-lg px-4 py-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            />
                            <button
                                type="submit"
                                disabled={sending || !messageInput.trim()}
                                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex-shrink-0"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    ) : (
                        <div className="text-center p-4 bg-muted/20 rounded-lg border border-border/30">
                            <p className="text-sm text-muted-foreground">
                                <Link href="/auth/signin" className="text-primary hover:underline">Sign in</Link> to send messages
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
