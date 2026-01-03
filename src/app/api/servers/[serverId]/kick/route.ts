import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        const { userId } = await req.json(); // User to kick

        await dbConnect();

        const server = await Server.findById(serverId);
        
        // Simple Owner Check 
        const isOwner = server.ownerId.toString() === session.user.id;
        if (!isOwner) {
             return NextResponse.json({ message: "Missing Permission: KICK_MEMBERS" }, { status: 403 });
        }

        if (server.ownerId.toString() === userId) {
             return NextResponse.json({ message: "Cannot kick server owner" }, { status: 400 });
        }

        await ServerMembers.findOneAndDelete({ serverId, userId });

        return NextResponse.json({ message: "User kicked successfully" }, { status: 200 });

    } catch (error) {
        console.error("Kick Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
