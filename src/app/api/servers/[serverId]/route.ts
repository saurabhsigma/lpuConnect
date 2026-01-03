import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";
import mongoose from "mongoose";

export async function GET(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = params;
        if (!mongoose.Types.ObjectId.isValid(serverId)) {
             return NextResponse.json({ message: "Invalid Server ID" }, { status: 400 });
        }

        await dbConnect();

        // 1. Check Membership
        const membership = await ServerMembers.findOne({
            serverId,
            userId: session.user.id
        });

        if (!membership) {
             return NextResponse.json({ message: "Access Denied" }, { status: 403 });
        }

        // 2. Fetch Server Details
        const server = await Server.findById(serverId).lean();
        if (!server) {
            return NextResponse.json({ message: "Server not found" }, { status: 404 });
        }

        // 3. Fetch Channels
        const channels = await Channel.find({ serverId }).sort({ position: 1 }).lean();

        return NextResponse.json({
            server,
            channels,
            member: membership // Return user's role/membership info
        }, { status: 200 });

    } catch (error) {
        console.error("Server Details Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
