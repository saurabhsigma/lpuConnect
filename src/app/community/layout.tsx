"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plus, Compass, MessageSquare } from "lucide-react";
import { useSession } from "next-auth/react";
import ServerIcon from "@/components/ServerIcon";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [servers, setServers] = useState<any[]>([]);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (session) fetchServers();
    }, [session]);

    const fetchServers = async () => {
        try {
            const res = await fetch("/api/servers");
            if (res.ok) {
                const data = await res.json();
                setServers(data);
            }
        } catch (error) {
            console.error("Failed to load servers", error);
        }
    };

    const handleCreateServer = async () => {
        const name = prompt("Enter Server Name:");
        if (!name) return;

        try {
            const res = await fetch("/api/servers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description: " A new community", icon: "" })
            });
            if (res.ok) {
                const data = await res.json();
                setServers(prev => [...prev, data.server]);
                router.push(`/community/${data.server._id}`);
            }
        } catch (error) {
            alert("Failed to create server");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* 1. SERVER RAIL (Far Left) */}
            <nav className="w-[72px] bg-secondary/10 flex flex-col items-center py-3 gap-2 border-r border-border shrink-0 z-50">
                
                {/* Home / Feed Button */}
                <ServerIcon 
                    name="Home" 
                    icon={<Compass size={28} />} 
                    href="/community" 
                    active={pathname === "/community"}
                    color="bg-indigo-500"
                />

                <div className="w-8 h-[2px] bg-border rounded-full mx-auto my-1" />

                {/* User's Servers */}
                <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
                    {servers.map(server => (
                        <ServerIcon 
                            key={server._id}
                            name={server.name}
                            image={server.icon} // TODO: Handle image rendering
                            href={`/community/${server._id}`}
                            active={pathname?.startsWith(`/community/${server._id}`)}
                        />
                    ))}
                    
                    {/* Create Server Button */}
                    <button 
                        onClick={handleCreateServer}
                        className="group flex items-center justify-center w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-background hover:bg-green-600 text-green-500 hover:text-white transition-all duration-200 shadow-sm"
                        title="Create a Server"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </nav>

            {/* 2. MAIN CONTENT (Child Layouts or Pages) */}
            <main className="flex-1 flex overflow-hidden">
                {children}
            </main>
        </div>
    );
}

