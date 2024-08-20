import mongoose, { Schema } from "mongoose";

const MessageSchema: Schema = new mongoose.Schema(
  { userId: Number, groupId: Number, message: String },
  { strict: false }
);

export const Message = mongoose.model("messages", MessageSchema);
