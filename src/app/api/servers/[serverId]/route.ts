import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Server } from "@/models/Server";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";
import { Message } from "@/models/Message"; // Imported for cleanup on delete
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

export async function PATCH(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        const { name, description, icon, rules } = await req.json();

        await dbConnect();

        const server = await Server.findById(serverId);
        if (!server) return NextResponse.json({ message: "Server not found" }, { status: 404 });

        // Authorization: Only Owner or Admin can edit
        // 1. Check if Owner
        const isOwner = server.ownerId.toString() === session.user.id;
        
        // 2. Check if Admin (if not owner)
        let isAdmin = false;
        if (!isOwner) {
            const membership = await ServerMembers.findOne({ serverId, userId: session.user.id });
            if (membership) {
                const adminRole = server.roles.find((r: any) => r.name === "Admin"); // Simple check
                if (adminRole && membership.roles.includes(adminRole._id)) {
                    isAdmin = true;
                }
            }
        }

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ message: "Forbidden: Insufficient Permissions" }, { status: 403 });
        }

        // Update Fields
        if (name) server.name = name;
        if (description) server.description = description;
        if (icon) server.icon = icon;
        if (rules !== undefined) server.rules = rules;

        await server.save();

        return NextResponse.json(server, { status: 200 });

    } catch (error) {
        console.error("Server Update Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        await dbConnect();

        const server = await Server.findById(serverId);
        if (!server) return NextResponse.json({ message: "Server not found" }, { status: 404 });

        // Authorization: Only Owner or Admin can delete
        const isOwner = server.ownerId.toString() === session.user.id;
        
         let isAdmin = false;
        if (!isOwner) {
            const membership = await ServerMembers.findOne({ serverId, userId: session.user.id });
            if (membership) {
                const adminRole = server.roles.find((r: any) => r.name === "Admin");
                if (adminRole && membership.roles.includes(adminRole._id)) {
                    isAdmin = true;
                }
            }
        }

        if (!isOwner && !isAdmin) {
             return NextResponse.json({ message: "Forbidden: Only Owner/Admin can delete server" }, { status: 403 });
        }

        // Cleanup
        // 1. Delete Channels
        await Channel.deleteMany({ serverId });
        // 2. Delete Members
        await ServerMembers.deleteMany({ serverId });
        // 3. Delete Messages (Optional, heavy op, maybe async later)
        // await Message.deleteMany({ channelId: { $in: ... } }); 

        // 4. Delete Server
        await Server.findByIdAndDelete(serverId);

        return NextResponse.json({ message: "Server deleted successfully" }, { status: 200 });

    } catch (error) {
         console.error("Server Delete Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
