import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { uploadImage } from "@/lib/cloudinary";
import User from "@/models/User";

export const runtime = "nodejs";

const parseList = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return [];
    return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
};

const parseLink = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed || undefined;
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const bio = (formData.get("bio") as string) || "";
        const courses = parseList(formData.get("courses"));
        const interests = parseList(formData.get("interests"));
        const socialLinks = {
            linkedin: parseLink(formData.get("linkedin")),
            github: parseLink(formData.get("github")),
            twitter: parseLink(formData.get("twitter")),
            instagram: parseLink(formData.get("instagram")),
        };
        const imageFile = formData.get("image");

        await dbConnect();

        let imageUrl: string | undefined;
        if (imageFile instanceof File && imageFile.size > 0) {
            imageUrl = await uploadImage(imageFile, "profile-images");
        }

        const updatePayload: Record<string, unknown> = {
            bio,
            courses,
            interests,
            socialLinks,
        };

        if (imageUrl) {
            updatePayload.image = imageUrl;
        }

        const updatedUser = await User.findOneAndUpdate(
            { email: session.user.email },
            updatePayload,
            { new: true, runValidators: true }
        );

        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Profile PUT error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
