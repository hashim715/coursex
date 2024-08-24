import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const pubClient: Redis = new Redis(process.env.REDISCLIENTURI);

export const subClient: Redis = new Redis(process.env.REDISCLIENTURI);

pubClient.on("connect", () => {
  console.log("pubClient connected");
});

subClient.on("connect", () => {
  console.log("subClient connected");
});
