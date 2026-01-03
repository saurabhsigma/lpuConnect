import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Message } from "@/models/Message";
import { ServerMembers } from "@/models/ServerMembers";
import { Channel } from "@/models/Channel";

export async function GET(req: Request, props: { params: Promise<{ channelId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { channelId } = params;
        await dbConnect();

        const channel = await Channel.findById(channelId);
        if (!channel) return NextResponse.json({ message: "Channel not found" }, { status: 404 });

        const membership = await ServerMembers.exists({ serverId: channel.serverId, userId: session.user.id });
        if (!membership) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        const messages = await Message.find({ channelId })
            .sort({ createdAt: 1 }) 
            .populate("senderId", "name image")
            .limit(50);

        return NextResponse.json(messages, { status: 200 });

    } catch (error) {
        console.error("Get Messages Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request, props: { params: Promise<{ channelId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { channelId } = params;
        const { content, fileUrl } = await req.json();

        await dbConnect();

        const channel = await Channel.findById(channelId);
        if (!channel) return NextResponse.json({ message: "Channel not found" }, { status: 404 });

        const member = await ServerMembers.findOne({ serverId: channel.serverId, userId: session.user.id });
        if (!member) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        const message = await Message.create({
            content,
            fileUrl,
            channelId,
            memberId: member._id,
            senderId: session.user.id
        });

        await message.populate("senderId", "name image");

        return NextResponse.json(message, { status: 201 });

    } catch (error) {
        console.error("Send Message Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
