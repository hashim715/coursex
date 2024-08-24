// import { Redis } from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// export const redisClient: Redis = new Redis(process.env.REDISCLIENTURI);

// redisClient.on("connect", () => {
//   console.log("Redis Client connected");
// });

// redisClient.on("error", () => {
//   console.log("something went wrong with redis");
// });

// redisClient.on("reconnecting", () => {
//   console.log("subClient reconnecting...");
// });

// redisClient.on("ready", () => {
//   console.log("pubClient ready");
// });

import { createClient, RedisClientType } from "redis";

// Define the Redis clients with a retry strategy
const redisClient: RedisClientType = createClient({
  url: process.env.REDISCLIENTURI,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error("Max reconnect attempts for Redis PubClient exceeded");
        return new Error("Max reconnect attempts for Redis PubClient exceeded");
      }
      console.log(`Redis PubClient reconnecting, attempt: ${retries}`);
      return Math.min(retries * 100, 3000); // Delay between retries
    },
  },
});

// Connection event handlers for pubClient
redisClient.on("connect", () => {
  console.log("Redis PubClient connected");
});

redisClient.on("ready", () => {
  console.log("Redis PubClient is ready");
});

redisClient.on("reconnecting", () => {
  console.log("Redis PubClient reconnecting...");
});

redisClient.on("error", (err: Error) => {
  console.error("Redis PubClient error:", err);
});

redisClient.on("end", () => {
  console.log("Redis PubClient connection closed");
});

// Connect the clients
(async () => {
  try {
    await redisClient.connect();
    console.log("Redis clients connected successfully");
  } catch (err) {
    console.error("Error connecting Redis clients:", err);
  }
})();

// Don't forget to export the clients if needed
export { redisClient };
