import mongoose, { Schema } from "mongoose";

const GroupSchema: Schema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  image: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/1911/1911087.png",
    required: false,
  },
  id: {
    type: String,
    unique: true,
    required: true,
  },
  adminId: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "No description available",
    required: false,
  },
});

export const Groups = mongoose.model("groups", GroupSchema);
