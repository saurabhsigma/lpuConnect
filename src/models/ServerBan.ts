import mongoose from "mongoose";

const ServerBanSchema = new mongoose.Schema(
  {
    serverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Server",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bannedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export const ServerBan = mongoose.models.ServerBan || mongoose.model("ServerBan", ServerBanSchema);
