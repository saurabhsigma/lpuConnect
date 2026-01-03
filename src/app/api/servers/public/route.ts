import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        await dbConnect();

        // 1. Get IDs of joined servers
        const joined = await ServerMembers.find({ userId: session.user.id }).select("serverId");
        const joinedIds = joined.map((j: any) => j.serverId);

        // 2. Find PUBLIC servers NOT in joinedIds
        const publicServers = await Server.find({
            _id: { $nin: joinedIds },
            visibility: "public"
        }).limit(20); // Limit results

        return NextResponse.json(publicServers, { status: 200 });

    } catch (error) {
        console.error("Discovery Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
