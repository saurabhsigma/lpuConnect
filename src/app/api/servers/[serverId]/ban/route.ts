import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";
import { ServerBan } from "@/models/ServerBan";

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        const { userId, reason } = await req.json(); // User to ban

        if (!userId) return NextResponse.json({ message: "User ID required" }, { status: 400 });

        await dbConnect();

        // 1. Permission Check (Actor)
        const actorMember = await ServerMembers.findOne({ serverId, userId: session.user.id });
        const server = await Server.findById(serverId);
        
        // Simple Owner Check for MVP. Real app uses PERMISSIONS.BAN_MEMBERS
        const isOwner = server.ownerId.toString() === session.user.id;
        if (!isOwner) {
            // Check Admin role
             // (Skipping deep role check implement for brevity, reusing 'Admin' Logic)
             return NextResponse.json({ message: "Missing Permission: BAN_MEMBERS" }, { status: 403 });
        }

        // 2. Prevent banning Owner
        if (server.ownerId.toString() === userId) {
            return NextResponse.json({ message: "Cannot ban server owner" }, { status: 400 });
        }

        // 3. Create Ban Record
        await ServerBan.create({
            serverId,
            userId,
            bannedById: session.user.id,
            reason
        });

        // 4. Kick (Remove Member)
        await ServerMembers.findOneAndDelete({ serverId, userId });

        return NextResponse.json({ message: "User banned successfully" }, { status: 200 });

    } catch (error) {
        console.error("Ban Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
