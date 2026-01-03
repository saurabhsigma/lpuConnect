import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { Invite } from "@/models/Invite";
import { ServerMembers } from "@/models/ServerMembers";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { serverId } = params;
        const { maxUses, expiresInSeconds } = await req.json(); // Default to infinite

        await dbConnect();

        // Permission Check
        const member = await ServerMembers.findOne({ serverId, userId: session.user.id }).populate('roles'); // Need roles populated for 'can' check
        // Note: We need to populate roles on the member object properly or fetch server roles.
        // For now, assuming simple Member check + Owners
        
        // TODO: Proper Role Populating for Permission Check
        // const hasPerm = await can(member, PERMISSIONS.CREATE_INVITE, null, { ownerId: ... });
        
        if (!member) return NextResponse.json({ message: "Access Denied" }, { status: 403 });

        let expiresAt = null;
        if (expiresInSeconds) {
            expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
        }

        const invite = await Invite.create({
            code: uuidv4().substring(0, 8),
            serverId,
            inviterId: session.user.id,
            maxUses: maxUses || 0, // 0 is infinite
            expiresAt
        });

        return NextResponse.json(invite, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function GET(req: Request, props: { params: Promise<{ serverId: string }> }) {
    const params = await props.params;
    try {
        const { serverId } = params;
        await dbConnect();
        
        // Only allow members to see invites? Probably.
        const invites = await Invite.find({ serverId }).populate('inviterId', 'name');
        return NextResponse.json(invites);
    } catch {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}
