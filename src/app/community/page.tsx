"use client";

import { useSession } from "next-auth/react";
import { Compass } from "lucide-react";
import { ServerDiscoveryList } from "@/components/ServerDiscovery";


export default function CommunityPage() {
    const { data: session } = useSession();

    return (
        <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 bg-background">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Main Feed */}
                <div className="md:col-span-3 space-y-6">
                    {/* Discovery Section (New) */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                             <Compass className="text-primary" /> Discover Communities
                        </h2>
                        <ServerDiscoveryList />
                    </div>

                </div>
            </div>
        </div>
    );
}

