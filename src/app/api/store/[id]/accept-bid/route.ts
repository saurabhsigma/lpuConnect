import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
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

        const product = await Product.findById(id);

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        // Check if user is the seller
        if (product.sellerId.toString() !== session.user.id) {
            return NextResponse.json({ message: "Forbidden: Only seller can accept bids" }, { status: 403 });
        }

        const { bidIndex } = await req.json();

        if (bidIndex === undefined || bidIndex < 0 || bidIndex >= product.bids.length) {
            return NextResponse.json({ message: "Invalid bid index" }, { status: 400 });
        }

        const acceptedBid = product.bids[bidIndex];
        const bidder = await User.findById(acceptedBid.userId).select('name');

        // Get seller name for bidder notification
        const seller = await User.findById(session.user.id).select('name');

        // Update product status to sold
        product.status = 'sold';
        await product.save();

        // Create notification for bidder (bid accepted)
        if (bidder) {
            await createNotification({
                userId: acceptedBid.userId.toString(),
                type: 'bid_accepted',
                title: 'Bid Accepted!',
                message: `Your bid on "${product.title}" has been accepted! Contact ${seller?.name || 'seller'} to complete the transaction.`,
                icon: '✅',
                actionUrl: `/store/${id}`,
                relatedId: id,
                relatedType: 'product',
            });
        }

        // Optionally notify other bidders that they lost
        for (let i = 0; i < product.bids.length; i++) {
            if (i !== bidIndex) {
                const otherBidder = product.bids[i];
                const otherBidderUser = await User.findById(otherBidder.userId).select('name');
                
                if (otherBidderUser) {
                    await createNotification({
                        userId: otherBidder.userId.toString(),
                        type: 'bid_received', // Reusing this type for "bid not accepted"
                        title: 'Bid Not Accepted',
                        message: `Your bid on "${product.title}" was not accepted. The item sold to another buyer.`,
                        icon: '❌',
                        actionUrl: `/store/${id}`,
                        relatedId: id,
                        relatedType: 'product',
                    });
                }
            }
        }

        const populatedProduct = await Product.findById(product._id)
            .populate('sellerId', 'name email image role')
            .populate({
                path: 'bids.userId',
                model: 'User',
                select: 'name image email'
            });

        return NextResponse.json({ message: "Bid accepted successfully", product: populatedProduct }, { status: 200 });
    } catch (error) {
        console.error("Accept bid error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
