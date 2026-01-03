"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const CATEGORIES = ['Tech', 'Sports', 'Arts', 'Academics', 'Social', 'Workshops', 'Networking'];

export default function CreateEventPage() {
    const router = useRouter();
    const { status } = useSession();
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
        category: "Social",
        tags: [] as string[],
    });
    const [tagInput, setTagInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (status === "unauthenticated") {
        router.push("/auth/signin");
        return null;
    }

    const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.toLowerCase().trim();
            if (!formData.tags.includes(newTag)) {
                setFormData({
                    ...formData,
                    tags: [...formData.tags, newTag],
                });
                setTagInput("");
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter(tag => tag !== tagToRemove),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                throw new Error("Failed to create event");
            }

            router.push("/events");
            router.refresh();
        } catch (err) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 flex items-center justify-center">
            <div className="glass-card w-full max-w-2xl p-6 md:p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/events" className="p-2 rounded-full hover:bg-muted transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Host an Event</h1>
                        <p className="text-muted-foreground text-sm">Fill in the details below</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Event Title</label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="Tech Meetup 2024"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Time</label>
                            <input
                                type="time"
                                required
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Category</label>
                            <select
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none cursor-pointer"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Location</label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="Block 38, Auditorium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                            required
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none h-32 resize-none placeholder:text-muted-foreground"
                            placeholder="What's this event about?"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Tags (Press Enter to add)</label>
                        <input
                            type="text"
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={addTag}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="Add relevant tags (e.g., JavaScript, beginners)"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map(tag => (
                                <div
                                    key={tag}
                                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-primary/30"
                                >
                                    #{tag}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cover Image URL (Optional)</label>
                        <input
                            type="url"
                            value={formData.image}
                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                            className="w-full bg-input border border-border rounded-lg p-2.5 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            placeholder="https://example.com/banner.jpg"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg disabled:opacity-50"
                    >
                        {loading ? "Creating Event..." : "Create Event"}
                    </button>
                </form>
            </div>
        </div>
    );
}
