"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Users, Clock, MapPin } from "lucide-react";
import { getAllAvatars } from "@/lib/avatars";

interface Event {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  attendees: string[];
  image?: string;
}

export default function Home() {
  const [topEvents, setTopEvents] = useState<Event[]>([]);
  const allAvatars = getAllAvatars();

  useEffect(() => {
    fetchTopEvents();
  }, []);

  const fetchTopEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setTopEvents(data.slice(0, 3)); // Top 3 events by attendance
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 opacity-50 blur-3xl" />

        <h1 className="relative z-10 text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-secondary animate-in fade-in slide-in-from-bottom-4 duration-1000">
          Campus Connect
        </h1>
        <br /> <br />
        
        {/* Animated Avatar Network */}
        <div className="relative z-10 mt-12 mb-8 h-48 w-full max-w-4xl">
          <div className="absolute inset-0 flex items-center justify-center">
            {allAvatars.map((avatar, index) => {
              const angle = (index / allAvatars.length) * Math.PI * 2;
              const radius = 120;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={avatar.id}
                  className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border-2 border-primary/30 flex items-center justify-center text-3xl animate-float shadow-lg"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 0.1}s`,
                    animationDuration: `${3 + (index % 3)}s`,
                  }}
                >
                  {avatar.emoji}
                </div>
              );
            })}
            
            {/* Center connecting node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl animate-pulse shadow-xl shadow-primary/50">
              🌐
            </div>
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20">
              {allAvatars.map((_, index) => {
                const angle = (index / allAvatars.length) * Math.PI * 2;
                const radius = 120;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                return (
                  <line
                    key={index}
                    x1="50%"
                    y1="50%"
                    x2={`calc(50% + ${x}px)`}
                    y2={`calc(50% + ${y}px)`}
                    stroke="url(#gradient)"
                    strokeWidth="2"
                    className="animate-pulse"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(147, 51, 234)" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* <div className="relative z-10 mt-10 flex gap-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <a
            href="/auth/signup"
            className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25"
          >
            Get Started
          </a>
          <a
            href="/auth/signin"
            className="px-8 py-3 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-semibold hover:bg-secondary/20 transition-all backdrop-blur-sm"
          >
            Sign In
          </a>
        </div> */}
      </section>

      {/* Top Events Section */}
      {topEvents.length > 0 && (
        <section className="py-20 px-4 max-w-7xl mx-auto w-full z-10">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold">
                Trending Events
              </h2>
              <p className="text-muted-foreground mt-2">Most popular events happening soon</p>
            </div>
            <Link 
              href="/events" 
              className="px-6 py-2 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topEvents.map((event) => (
              <Link
                key={event._id}
                href={`/events/${event._id}`}
                className="glass-card rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300"
              >
                <div className="relative h-48 bg-muted/50">
                  {event.image ? (
                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <Calendar size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-white flex items-center gap-1">
                    <Users size={14} />
                    {event.attendees.length}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-3 line-clamp-1">{event.title}</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock size={14} className="text-secondary" />
                      {event.time}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin size={14} className="text-accent" />
                      {event.location}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section className="py-20 px-4 max-w-7xl mx-auto w-full z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">
          Everything you need is here.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Surplus Store",
              description: "Buy and sell used textbooks, gadgets, and more with trusted peers.",
              icon: "🛍️",
              color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
              href: "/store",
            },
            {
              title: "Hoodmaps",
              description: "Discover hidden gems, rate hostels, and navigate campus like a pro.",
              icon: "🗺️",
              color: "bg-green-500/10 border-green-500/20 text-green-400",
              href: "/hoodmaps",
            },
            {
              title: "Event Feed",
              description: "Never miss a campus event. RSVP and see who's going.",
              icon: "📅",
              color: "bg-orange-500/10 border-orange-500/20 text-orange-400",
              href: "/events",
            },
            {
              title: "Community",
              description: "Join discussions, clubs, and connect with students sharing your interests.",
              icon: "💬",
              color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
              href: "/community",
            },
            {
              title: "Student Profiles",
              description: "Showcase your skills, courses, and connect with potential study buddies.",
              icon: "👤",
              color: "bg-pink-500/10 border-pink-500/20 text-pink-400",
              href: "/profile",
            },
          ].map((feature, i) => (
            <Link
              key={i}
              href={feature.href}
              className={`p-8 rounded-2xl border backdrop-blur-sm hover:scale-105 transition-transform duration-300 ${feature.color}`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
