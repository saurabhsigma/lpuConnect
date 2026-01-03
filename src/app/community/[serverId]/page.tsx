"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Hash, Send, Paperclip } from "lucide-react";
import clsx from "clsx";

export default function ChannelPage({ params }: { params: Promise<{ serverId: string, channelId?: string }> }) {
    // Note: Next.js 13+ App Router passes params to page props, but checking just in case
    // We actually need to capture the sub-route segment. 
    // Since this is the [serverId]/page.tsx, it might handle the "Default" channel state.
    
    // HOWEVER, the real chat should probably be in [channelId]/page.tsx.
    // For Option A, if we want everything in `community/[serverId]`, we need nested layouts.
    // Let's assume this page redirects to the default channel OR renders a "Select a channel" screen.
    
    return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-8 text-center flex-col gap-4">
           <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center">
               <Hash size={32} />
           </div>
           <div>
               <h2 className="text-xl font-bold text-foreground">Welcome to the Server!</h2>
               <p>Select a channel from the sidebar to start chatting.</p>
           </div>
        </div>
    );
}
