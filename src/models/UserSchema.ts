import mongoose, { Schema } from "mongoose";

const UserSchema: Schema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Must provide email"],
    trim: true,
    unique: true,
    lowercase: true,
    maxlength: [30, "Name cannot be more than 20 characters"],
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Please fill a valid email address",
    ],
  },
  schoolName: {
    type: String,
    required: [true, "Must provide school name"],
    trim: true,
    lowercase: true,
    unique: false,
  },
});

export const User = mongoose.model("users", UserSchema);
