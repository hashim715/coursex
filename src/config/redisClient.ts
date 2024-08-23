import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient: Redis = new Redis(process.env.REDISCLIENTURI);

redisClient.on("connect", () => {
  console.log("Redis Client connected");
});
