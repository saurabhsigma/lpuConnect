import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ServerMembers } from "@/models/ServerMembers";

export async function GET(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        await dbConnect();

        // Check if requester is a member
        const requester = await ServerMembers.findOne({ serverId, userId: session.user.id });
        if (!requester) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        // Fetch all members for this server
        // Populate userId to get name/image
        // Populate roles to display badges
        const members = await ServerMembers.find({ serverId })
            .populate('userId', 'name image')
            .populate('roles', 'name color')
            .sort({ joinedAt: 1 })
            .limit(100); // Pagination in future

        return NextResponse.json(members, { status: 200 });

    } catch (error) {
        console.error("Members List Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
