import mongoose, { Schema } from "mongoose";

const UserSchema: Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    default:
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg",
    required: false,
  },
  course_1: {
    type: String,
    default: "None",
    required: false,
  },
  course_2: {
    type: String,
    default: "None",
    required: false,
  },
  course_3: {
    type: String,
    default: "None",
    required: false,
  },
  course_4: {
    type: String,
    default: "None",
    required: false,
  },
  course_5: {
    type: String,
    default: "None",
    required: false,
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  num_groups: {
    type: Number,
    default: 0,
    required: false,
  },
});

export const User = mongoose.model("user", UserSchema);
