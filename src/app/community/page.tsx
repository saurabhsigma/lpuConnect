"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, Heart, MessageCircle, Send, User } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

interface Post {
    _id: string;
    content: string;
    category: string;
    createdAt: string;
    authorId: {
        name: string;
        image?: string;
    };
    likes: string[];
    comments: any[];
}

export default function CommunityPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [category, setCategory] = useState("General");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const res = await fetch("/api/community");
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !session) return;
        setSending(true);

        try {
            const res = await fetch("/api/community", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newPost, category }),
            });

            if (res.ok) {
                setNewPost("");
                fetchPosts(); // Refresh posts
            }
        } catch (error) {
            console.error("Error posting:", error);
        } finally {
            setSending(false);
        }
    };

    const categories = ['General', 'Clubs', 'Academic', 'Events', 'Other'];

    const filteredPosts = category === 'General' && posts.length > 0 ? posts : posts.filter(p => p.category === category);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="relative px-4 md:px-8 pt-8 pb-12 md:pt-16 md:pb-20 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10 border-b border-border">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <MessageSquare className="text-white" size={24} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                            Community Hub
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-lg max-w-2xl">Connect with students, share ideas, and build meaningful discussions around campus life.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 md:px-8 py-8 md:py-12">

                {/* Sidebar / Filters */}
                <div className="md:col-span-1 space-y-4">
                    <div className="glass-card p-4 rounded-2xl sticky top-24 border border-border/50">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><MessageSquare size={18} className="text-purple-400" /> Topics</h2>
                        <div className="space-y-2">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        category === cat ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Feed */}
                <div className="md:col-span-3 space-y-6">
                    {/* Post Input */}
                    {session ? (
                        <div className="glass-card p-6 rounded-2xl border border-border/50">
                            <form onSubmit={handlePost}>
                                <textarea
                                    className="w-full bg-input rounded-lg p-3 border border-border text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none placeholder:text-muted-foreground"
                                    placeholder="What's on your mind?"
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="bg-input text-foreground border border-border rounded px-3 py-1 text-sm outline-none cursor-pointer hover:border-primary"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={!newPost.trim() || sending}
                                        className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {sending ? "Posting..." : <><Send size={16} /> Post</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="glass-card p-8 rounded-2xl text-center border-2 border-dashed border-border/50">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={32} className="text-purple-400/50" />
                            </div>
                            <p className="text-foreground font-semibold text-lg mb-2">Join the Conversation</p>
                            <p className="text-muted-foreground mb-6">Sign in to post, comment, and engage with the community</p>
                            <Link href="/auth/signin" className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/40 transition-all">Sign In</Link>
                        </div>
                    )}

                    {/* Posts List */}
                    {loading ? (
                        <div className="text-center py-16">
                            <div className="animate-pulse text-muted-foreground text-lg">Loading discussions...</div>
                        </div>
                    ) : filteredPosts.length === 0 ? (
                        <div className="text-center py-16 glass-card rounded-2xl border-2 border-dashed border-border/50">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={32} className="text-purple-400/50" />
                            </div>
                            <p className="text-foreground font-semibold text-lg mb-2">No posts yet</p>
                            <p className="text-muted-foreground">Be the first to say hello in this category!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredPosts.map((post, idx) => (
                                <div key={post._id} className="glass-card p-6 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 border border-border/50 hover:shadow-lg transition-all duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                                            {post.authorId?.name?.[0] || <User size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{post.authorId?.name || "Anonymous"}</h3>
                                            <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()} • {post.category}</p>
                                        </div>
                                    </div>

                                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                    <div className="flex items-center gap-6 pt-4 border-t border-border/50 text-muted-foreground">
                                        <button className="flex items-center gap-1 hover:text-red-400 transition-colors">
                                            <Heart size={18} /> <span className="text-sm">{post.likes?.length || 0}</span>
                                        </button>
                                        <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                            <MessageCircle size={18} /> <span className="text-sm">{post.comments?.length || 0} Comments</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
