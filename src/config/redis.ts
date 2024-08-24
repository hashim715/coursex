import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisOptions = {
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (error: Error) => {
    if (error.message.includes("ECONNREFUSED")) {
      return true;
    }
    return false;
  },
};

export const pubClient: Redis = new Redis(process.env.REDIS_URI, redisOptions);
export const subClient: Redis = new Redis(process.env.REDIS_URI, redisOptions);

pubClient.on("connect", () => {
  console.log("pubClient connected");
});

subClient.on("connect", () => {
  console.log("subClient connected");
});

pubClient.on("error", (err) => {
  console.error("Error in pubClient:", err);
});

subClient.on("error", (err) => {
  console.error("Error in subClient:", err);
});

pubClient.on("reconnecting", () => {
  console.log("pubClient reconnecting...");
});

subClient.on("reconnecting", () => {
  console.log("subClient reconnecting...");
});

pubClient.on("ready", () => {
  console.log("pubClient ready");
});

subClient.on("ready", () => {
  console.log("subClient ready");
});
