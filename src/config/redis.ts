import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const pubClient: Redis = new Redis(process.env.REDIS_URI);

export const subClient: Redis = new Redis(process.env.REDIS_URI);

pubClient.on("connect", () => {
  console.log("pubClient connected");
});

subClient.on("connect", () => {
  console.log("subClient connected");
});

pubClient.on("error", () => {
  console.log("something went wrong with pubclient");
});

subClient.on("error", () => {
  console.log("something went wrong with subclient");
});
