"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Users, Clock, Search, X } from "lucide-react";
import { useSession } from "next-auth/react";

const CATEGORIES = ['All', 'Tech', 'Sports', 'Arts', 'Academics', 'Social', 'Workshops', 'Networking'];

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category?: string;
    tags?: string[];
    image?: string;
    organizerId: {
        name: string;
        image?: string;
    };
    attendees: string[];
}

export default function EventsPage() {
    const { data: session } = useSession();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch("/api/events");
            if (res.ok) {
                const data = await res.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEvents = events.filter(event => {
        const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
        const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             event.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags.length === 0 || 
                           selectedTags.some(tag => event.tags?.includes(tag));
        return matchesCategory && matchesSearch && matchesTags;
    });

    const allTags = Array.from(new Set(events.flatMap(e => e.tags || [])));

    const handleRSVP = async (eventId: string) => {
        if (!session) return;

        // Optimistic update
        setEvents(events.map(e => {
            if (e._id === eventId) {
                const isAttending = e.attendees.includes(session.user.id);
                return {
                    ...e,
                    attendees: isAttending
                        ? e.attendees.filter(id => id !== session.user.id)
                        : [...e.attendees, session.user.id]
                };
            }
            return e;
        }));

        try {
            await fetch(`/api/events/${eventId}/rsvp`, { method: "POST" });
        } catch (error) {
            console.error("RSVP error:", error);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-6xl mx-auto">
                {/* Hero Header */}
                <div className="relative px-4 md:px-8 pt-8 pb-12 md:pt-16 md:pb-20 bg-gradient-to-br from-orange-500/10 via-background to-red-500/10 border-b border-border">
                    <div className="flex justify-between items-start gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                    <Calendar className="text-white" size={24} />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400">
                                    Campus Events
                                </h1>
                            </div>
                            <p className="text-muted-foreground text-lg max-w-xl">Discover and join exciting events happening around campus. Connect with your community.</p>
                        </div>
                        <Link
                            href="/events/new"
                            className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition-all duration-300 flex items-center gap-2 whitespace-nowrap hover:-translate-y-1"
                        >
                            <Plus size={20} /> Create Event
                        </Link>
                    </div>
                </div>

                {/* Content */}
                <div className="px-4 md:px-8 py-8 md:py-12">
                    {/* Search and Filters */}
                    <div className="mb-8 space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-3 text-muted-foreground" size={20} />
                            <input
                                type="text"
                                placeholder="Search events by name or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-input border border-border rounded-lg pl-12 pr-4 py-3 text-foreground focus:border-primary outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground">Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full font-medium transition-all ${
                                            selectedCategory === cat
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tag Filter */}
                        {allTags.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-foreground">Filter by Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {allTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                                selectedTags.includes(tag)
                                                    ? 'bg-primary/30 text-primary border border-primary'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Clear Filters */}
                        {(selectedCategory !== 'All' || searchQuery || selectedTags.length > 0) && (
                            <button
                                onClick={() => {
                                    setSelectedCategory('All');
                                    setSearchQuery('');
                                    setSelectedTags([]);
                                }}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                <X size={14} /> Clear Filters
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <p className="text-sm text-muted-foreground mb-6">
                        Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                    </p>

                    {/* Events Grid/List */}
                    {loading ? (
                        <div className="text-center py-32">
                            <div className="animate-pulse text-muted-foreground text-lg">Loading events...</div>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-32 glass-card rounded-3xl border-2 border-dashed border-border/50">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center mx-auto mb-4">
                                <Calendar size={32} className="text-orange-400/50" />
                            </div>
                            <p className="text-foreground font-semibold text-lg mb-2">No events found</p>
                            <p className="text-muted-foreground mb-6">Try adjusting your filters or create the first event!</p>
                            <Link href="/events/new" className="inline-block px-6 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all">Create an Event</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {filteredEvents.map(event => {
                                const isAttending = session && event.attendees.includes(session.user.id);
                                return (
                                    <Link 
                                        key={event._id} 
                                        href={`/events/${event._id}`}
                                        className="group glass-card rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-border/50"
                                    >
                                        <div className="md:w-2/5 h-56 md:h-auto relative bg-gradient-to-br from-muted/50 to-muted/20 overflow-hidden">
                                            {event.image ? (
                                                <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="h-full flex items-center justify-center bg-gradient-to-br from-orange-500/10 to-red-500/10">
                                                    <Calendar size={64} className="opacity-20" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            <div className="absolute top-4 left-4 bg-gradient-to-br from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl text-center shadow-lg font-semibold">
                                                <p className="text-xs font-bold uppercase tracking-wide">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                                <p className="text-2xl font-bold">{new Date(event.date).getDate()}</p>
                                            </div>
                                            {event.category && (
                                                <div className="absolute top-4 right-4 bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-bold">
                                                    {event.category}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 p-8 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <h2 className="text-2xl md:text-3xl font-bold group-hover:text-orange-400 transition-colors flex-1">{event.title}</h2>
                                                    {isAttending && <span className="px-4 py-1.5 bg-green-500/15 text-green-400 text-xs font-bold rounded-full border border-green-500/30 whitespace-nowrap ml-2">✓ GOING</span>}
                                                </div>
                                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.description}</p>
                                                
                                                {/* Tags */}
                                                {event.tags && event.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {event.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                        {event.tags.length > 3 && (
                                                            <span className="text-xs text-muted-foreground">+{event.tags.length - 3} more</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                        <Clock size={16} className="text-blue-400 flex-shrink-0" />
                                                        <span className="font-medium">{event.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                        <MapPin size={16} className="text-pink-400 flex-shrink-0" />
                                                        <span className="font-medium truncate">{event.location}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                                                        <Users size={16} className="text-green-400 flex-shrink-0" />
                                                        <span className="font-medium">{event.attendees.length} going</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRSVP(event._id);
                                                }}
                                                className={`mt-6 px-6 py-2 rounded-full font-semibold transition-all ${
                                                    isAttending
                                                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                                        : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                                                }`}
                                            >
                                                {isAttending ? '✓ Cancel RSVP' : 'RSVP'}
                                            </button>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
