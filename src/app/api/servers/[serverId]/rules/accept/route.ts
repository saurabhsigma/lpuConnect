import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ServerMembers } from "@/models/ServerMembers";

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        await dbConnect();

        const member = await ServerMembers.findOneAndUpdate(
            { serverId, userId: session.user.id },
            { rulesAccepted: true },
            { new: true }
        );

        if (!member) return NextResponse.json({ message: "Member not found" }, { status: 404 });

        return NextResponse.json({ message: "Rules accepted", member }, { status: 200 });

    } catch (error) {
        console.error("Rules Accept Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
