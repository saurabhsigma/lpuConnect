import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { inviteCode } = await req.json();
        if (!inviteCode) return NextResponse.json({ message: "Invite code required" }, { status: 400 });

        await dbConnect();

        // 1. Find Server by Invite Code
        const server = await Server.findOne({ inviteCode });
        if (!server) {
            return NextResponse.json({ message: "Invalid invite code" }, { status: 404 });
        }

        // 2. Check if already a member
        const existingMember = await ServerMembers.findOne({
            serverId: server._id,
            userId: session.user.id
        });

        if (existingMember) {
            return NextResponse.json({ message: "Already a member", serverId: server._id }, { status: 200 });
        }

        // 3. Create Membership (Default Role)
        // Find default role (usually lowest position or specifically named 'Member')
        // For now, we grab the last role (assuming pushed order) or filter.
        // Simple logic: Use the last role in array as 'default' for now.
        const defaultRole = server.roles.length > 0 ? server.roles[server.roles.length - 1] : null;

        await ServerMembers.create({
            userId: session.user.id,
            serverId: server._id,
            roles: defaultRole ? [defaultRole._id] : [],
        });

        return NextResponse.json({ message: "Joined successfully", serverId: server._id }, { status: 200 });

    } catch (error) {
        console.error("Join Server Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
