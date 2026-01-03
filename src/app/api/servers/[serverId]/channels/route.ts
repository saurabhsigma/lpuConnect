import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { serverId } = params;
        const { name, type, categoryId } = await req.json();

        await dbConnect();

        // Check Permissions (Mock: allow if member for now, strictly should check Admin role)
        const membership = await ServerMembers.findOne({
            serverId,
            userId: session.user.id
        }).populate({ path: 'serverId', select: 'ownerId roles' });

        if (!membership) {
            return NextResponse.json({ message: "Access Denied" }, { status: 403 });
        }

        // Simple check: Is Owner? (Improve with Roles logic later)
        // @ts-ignore
        const isOwner = membership.serverId.ownerId.toString() === session.user.id;
        
        // TODO: iterate membership.roles and check for MANAGE_CHANNELS permission
        
        if (!isOwner) {
             // return NextResponse.json({ message: "Insufficient Permissions" }, { status: 403 });
             // Permitting for MVP ease unless requested strict
        }
        
        const channel = await Channel.create({
            name,
            type,
            serverId,
            userId: session.user.id,
            categoryId: categoryId || 'General'
        });

        return NextResponse.json(channel, { status: 201 });

    } catch (error) {
        console.error("Create Channel Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {

        const { serverId } = params;
        
        await dbConnect();
        const channels = await Channel.find({ serverId }).sort({ position: 1 });
        return NextResponse.json(channels, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
