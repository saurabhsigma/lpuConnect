import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";

export async function DELETE(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        await dbConnect();

        const server = await Server.findById(serverId);
        if (!server) return NextResponse.json({ message: "Server not found" }, { status: 404 });

        // Check if user is the Owner
        if (server.ownerId.toString() === session.user.id) {
            return NextResponse.json({ 
                message: "Owner cannot leave server. Transfer ownership or delete the server." 
            }, { status: 400 });
        }

        const deleted = await ServerMembers.findOneAndDelete({
            serverId,
            userId: session.user.id
        });

        if (!deleted) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Left server successfully" }, { status: 200 });

    } catch (error) {
        console.error("Leave Server Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
