"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Hash, Send, Paperclip, User } from "lucide-react";

export default function ChatPage() {
    const params = useParams();
    const serverId = params?.serverId as string;
    const channelId = params?.channelId as string;

    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (channelId) fetchMessages();
    }, [channelId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage }),
            });

            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage("");
                scrollToBottom();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            {/* Channel Header */}
            <div className="h-12 border-b border-border flex items-center px-4 shadow-sm bg-background/50 backdrop-blur">
                <Hash size={20} className="text-muted-foreground mr-2" />
                <span className="font-bold">chat</span> 
                {/* Dynamically load name if possible, or pass from layout */}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="text-center text-muted-foreground">Loading specific channel permissions...</div>
                    // Fun message
                ) : (
                    messages.map((msg, i) => {
                        const isSameUser = i > 0 && messages[i - 1].senderId?._id === msg.senderId?._id;
                        return (
                            <div key={msg._id} className={`flex gap-3 group ${isSameUser ? 'mt-1' : 'mt-4'}`}>
                                {!isSameUser ? (
                                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 overflow-hidden">
                                        {msg.senderId?.image ? (
                                            <img src={msg.senderId.image} alt={msg.senderId.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} />
                                        )}
                                    </div>
                                ) : <div className="w-10 shrink-0" />}
                                
                                <div className="flex-1">
                                    {!isSameUser && (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold hover:underline cursor-pointer">{msg.senderId?.name || "User"}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    )}
                                    <p className="text-foreground/90 whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 pt-2">
                <form onSubmit={handleSend} className="bg-secondary/10 rounded-lg p-2.5 flex items-center gap-2 border border-transparent focus-within:border-primary/50 transition-colors">
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                        <Paperclip size={20} />
                    </button>
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder-muted-foreground"
                        placeholder={`Message`}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="text-muted-foreground hover:text-primary disabled:opacity-50">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </>
    );
}
