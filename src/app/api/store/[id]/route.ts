import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import User from "@/models/User";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // Validate ID format if needed, but mongoose might throw if invalid
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
        }

        const product = await Product.findById(id).populate('sellerId', 'name email image');

        if (!product) {
            return NextResponse.json({ message: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error("Product GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
