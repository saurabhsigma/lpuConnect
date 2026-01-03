import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Notification from "@/models/Notification";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        await dbConnect();

        // Get pagination params
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const page = parseInt(searchParams.get("page") || "1");

        // Get notifications
        const notifications = await Notification.find({
            userId: session.user?.id,
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)
            .lean();

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            userId: session.user?.id,
            read: false,
        });

        return NextResponse.json({
            notifications,
            unreadCount,
            page,
            limit,
        });
    } catch (error) {
        console.error("Get notifications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { notificationIds } = body;

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json(
                { error: "Invalid request" },
                { status: 400 }
            );
        }

        await dbConnect();

        // Mark as read
        await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                userId: session.user?.id,
            },
            { read: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark as read error:", error);
        return NextResponse.json(
            { error: "Failed to mark notifications as read" },
            { status: 500 }
        );
    }
}

// Mark single notification as read
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("id");

        if (!notificationId) {
            return NextResponse.json(
                { error: "Missing notification id" },
                { status: 400 }
            );
        }

        await dbConnect();

        const notification = await Notification.findOneAndUpdate(
            {
                _id: notificationId,
                userId: session.user?.id,
            },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json(
                { error: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ notification });
    } catch (error) {
        console.error("Mark single notification error:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
