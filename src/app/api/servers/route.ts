import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { Channel } from "@/models/Channel";
import { ServerMembers } from "@/models/ServerMembers";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { name, description, icon } = await req.json();

        if (!name) {
            return NextResponse.json({ message: "Server name is required" }, { status: 400 });
        }

        await dbConnect();

        // 1. Create Server
        const server = await Server.create({
            name,
            description,
            icon,
            ownerId: session.user.id,
            inviteCode: uuidv4().substring(0, 8), // Simple 8-char code
            roles: [{
                name: "Admin",
                color: "#ff0000",
                permissions: ["ADMINISTRATOR"],
                position: 999
            }, {
                name: "Member",
                color: "#99aab5",
                permissions: ["VIEW_CHANNELS", "SEND_MESSAGES"],
                position: 0
            }]
        });

        // 2. Create Default Channel
        const generalChannel = await Channel.create({
            name: "general",
            type: "text",
            serverId: server._id,
            userId: session.user.id
        });

        // 3. Create Member (Owner)
        await ServerMembers.create({
            userId: session.user.id,
            serverId: server._id,
            roles: [server.roles[0]._id], // Assign Admin role
        });

        return NextResponse.json({ 
            server, 
            redirectUrl: `/servers/${server._id}/channels/${generalChannel._id}` 
        }, { status: 201 });

    } catch (error) {
        console.error("Server Creation Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        // Find all servers where the user is a member
        const memberships = await ServerMembers.find({ userId: session.user.id }).select('serverId');
        const serverIds = memberships.map((m: any) => m.serverId);

        const servers = await Server.find({ _id: { $in: serverIds } });

        return NextResponse.json(servers, { status: 200 });

    } catch (error) {
        console.error("Server Fetch Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
