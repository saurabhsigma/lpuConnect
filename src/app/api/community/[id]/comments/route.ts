import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import { createNotification } from "@/lib/notifications";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const { id } = await params;

        const post = await Post.findById(id);

        if (!post) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const { text } = await req.json();

        if (!text || !text.trim()) {
            return NextResponse.json({ message: "Comment text is required" }, { status: 400 });
        }

        // Add comment
        post.comments.push({
            authorId: session.user.id,
            text: text.trim(),
            createdAt: new Date(),
        });

        await post.save();

        // Get commenter info
        const commenter = await User.findById(session.user.id).select('name');

        // Create notification for post author (only if commenter is not the author)
        if (post.authorId.toString() !== session.user.id && commenter) {
            await createNotification({
                userId: post.authorId.toString(),
                type: 'post_comment',
                title: 'New Comment',
                message: `${commenter.name} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                icon: '💬',
                actionUrl: `/community#post-${id}`,
                relatedId: id,
                relatedType: 'post',
            });
        }

        // Populate and return
        const populatedPost = await Post.findById(post._id)
            .populate('authorId', 'name image')
            .populate('comments.authorId', 'name image');

        return NextResponse.json(populatedPost, { status: 200 });
    } catch (error) {
        console.error("Comment POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
