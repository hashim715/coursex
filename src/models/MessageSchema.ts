import mongoose, { Schema } from "mongoose";

const MessageSchema: Schema = new mongoose.Schema(
  { sender: String, groupId: Number, message: Schema.Types.Mixed },
  { strict: false }
);

export const Message = mongoose.model("messages", MessageSchema);
