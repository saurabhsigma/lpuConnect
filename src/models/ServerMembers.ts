import mongoose, { Schema,model,models } from "mongoose";

const serverMembersSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serverId: { type: mongoose.Schema.Types.ObjectId, ref: "Server", required: true },
    status: { type: String, enum: ["member", "admin", "owner"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
},{timestamps:true});

export const ServerMembers = models.ServerMembers || model("ServerMembers",serverMembersSchema);