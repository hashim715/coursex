import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redisClient: Redis = new Redis(process.env.REDISCLIENTURI);

redisClient.on("connect", () => {
  console.log("Redis Client connected");
});

redisClient.on("error", () => {
  console.log("something went wrong with redis");
});

redisClient.on("reconnecting", () => {
  console.log("subClient reconnecting...");
});

redisClient.on("ready", () => {
  console.log("pubClient ready");
});
