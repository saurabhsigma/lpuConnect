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
        const { newOwnerId } = await req.json();

        if (!newOwnerId) return NextResponse.json({ message: "New Owner ID required" }, { status: 400 });

        await dbConnect();

        const server = await Server.findById(serverId);
        if (!server) return NextResponse.json({ message: "Server not found" }, { status: 404 });

        // 1. Check if current user is Owner
        if (server.ownerId.toString() !== session.user.id) {
            return NextResponse.json({ message: "Only owner can transfer ownership" }, { status: 403 });
        }

        // 2. Verify New Owner is a Member
        const newOwnerMember = await ServerMembers.findOne({ serverId, userId: newOwnerId });
        if (!newOwnerMember) {
            return NextResponse.json({ message: "Target user is not a member of this server" }, { status: 400 });
        }

        // 3. Update Ownership
        server.ownerId = newOwnerId;
        await server.save();

        // 4. Update Roles (Optional: Give new owner Admin role if not already?)
        // Implicitly, ownerId check overrides roles, so this is fine.

        return NextResponse.json({ message: "Ownership transferred successfully" }, { status: 200 });

    } catch (error) {
        console.error("Transfer Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
