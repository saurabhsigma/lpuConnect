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

        const userId = session.user.id;
        const likeIndex = post.likes.indexOf(userId);

        let isLiked = false;

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(userId);
            isLiked = true;
        }

        await post.save();

        // Create notification for post author only on like (not unlike), and only if liker is not the author
        if (isLiked && post.authorId.toString() !== session.user.id) {
            const liker = await User.findById(userId).select('name');

            if (liker) {
                await createNotification({
                    userId: post.authorId.toString(),
                    type: 'post_like',
                    title: 'Post Liked',
                    message: `${liker.name} liked your post`,
                    icon: '❤️',
                    actionUrl: `/community#post-${id}`,
                    relatedId: id,
                    relatedType: 'post',
                });
            }
        }

        // Populate and return
        const populatedPost = await Post.findById(post._id)
            .populate('authorId', 'name image')
            .populate('comments.authorId', 'name image')
            .populate('likes', 'name');

        return NextResponse.json(populatedPost, { status: 200 });
    } catch (error) {
        console.error("Like POST error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
