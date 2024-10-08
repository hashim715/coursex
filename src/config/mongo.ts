import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGO_URI;

const clientOptions = {
  serverApi: {
    version: "1",
    deprecationErrors: true,
    readPreference: "secondaryPreferred",
  },
};

export const connectDB: Function = async (): Promise<void> => {
  try {
    await mongoose.connect(uri, clientOptions as ConnectOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("Connected to MongoDB cluster");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};
