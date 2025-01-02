import mongoose, { Schema } from "mongoose";

const MessageSchema: Schema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    groupId: { type: Number, required: true },
    message: { type: Schema.Types.Mixed },
    timeStamp: { type: Date, required: true },
  },
  { strict: false }
);

// Add an index for efficient sorting by timeStamp
MessageSchema.index({ timeStamp: -1 });

export const Message = mongoose.model("messages", MessageSchema);
