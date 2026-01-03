import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Please enter an email and password");
                }

                await dbConnect();

                // Find user by email
                // Explicitly selecting password since it has select: false in schema
                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user) {
                    throw new Error("No user found with this email");
                }

                // Check if password matches
                const isMatch = await bcrypt.compare(credentials.password, user.password);

                if (!isMatch) {
                    throw new Error("Incorrect password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin", // Custom sign-in page
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
