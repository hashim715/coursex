import mongoose, { ConnectOptions } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@main.dexutzy.mongodb.net/?retryWrites=true&w=majority&appName=Main`;

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
