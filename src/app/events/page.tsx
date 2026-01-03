"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useSession } from "next-auth/react";

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
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
            // Revert on error would be ideal here
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-400 flex items-center gap-2">
                            <Calendar className="text-orange-400" /> Campus Events
                        </h1>
                        <p className="text-muted-foreground mt-1">See what's happening around you.</p>
                    </div>
                    <Link
                        href="/events/new"
                        className="px-6 py-2 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/25"
                    >
                        <Plus size={18} /> Create Event
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-muted-foreground">Loading events...</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground glass-card rounded-2xl">
                        <p>No upcoming events.</p>
                        <Link href="/events/new" className="text-primary hover:underline mt-2 inline-block">Host an event</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {events.map(event => {
                            const isAttending = session && event.attendees.includes(session.user.id);
                            return (
                                <Link 
                                    key={event._id} 
                                    href={`/events/${event._id}`}
                                    className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
                                >
                                    <div className="md:w-1/3 h-48 md:h-auto relative bg-muted/50">
                                        {event.image ? (
                                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                                <Calendar size={48} className="opacity-20" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur px-3 py-1 rounded-lg text-center shadow-sm">
                                            <p className="text-xs font-bold text-muted-foreground uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</p>
                                            <p className="text-xl font-bold">{new Date(event.date).getDate()}</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h2 className="text-2xl font-bold">{event.title}</h2>
                                                {isAttending && <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20">GOING</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                                                <span className="flex items-center gap-1"><MapPin size={14} /> {event.location}</span>
                                                <span className="flex items-center gap-1"><Users size={14} /> {event.attendees.length} attending</span>
                                                <span className="flex items-center gap-1">Organized by {event.organizerId?.name}</span>
                                            </div>
                                            <p className="text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleRSVP(event._id);
                                                }}
                                                disabled={!session}
                                                className={`flex-1 py-2 rounded-lg font-medium transition-all ${isAttending
                                                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                                    } ${!session && "opacity-50 cursor-not-allowed"}`}
                                            >
                                                {isAttending ? "Cancel RSVP" : "RSVP Now"}
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
