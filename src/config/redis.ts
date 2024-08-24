// import { Redis } from "ioredis";
// import dotenv from "dotenv";

// dotenv.config();

// export const pubClient: Redis = new Redis(process.env.REDISCLIENTURI);
// export const subClient: Redis = new Redis(process.env.REDISCLIENTURI);

// pubClient.on("connect", () => {
//   console.log("pubClient connected");
// });

// subClient.on("connect", () => {
//   console.log("subClient connected");
// });

// pubClient.on("error", (err) => {
//   console.error("Error in pubClient:", err);
// });

// subClient.on("error", (err) => {
//   console.error("Error in subClient:", err);
// });

// pubClient.on("reconnecting", () => {
//   console.log("pubClient reconnecting...");
// });

// subClient.on("reconnecting", () => {
//   console.log("subClient reconnecting...");
// });

// pubClient.on("ready", () => {
//   console.log("pubClient ready");
// });

// subClient.on("ready", () => {
//   console.log("subClient ready");
// });

import { createClient, RedisClientType } from "redis";

// Define the Redis clients with a retry strategy
const pubClient: RedisClientType = createClient({
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

const subClient: RedisClientType = createClient({
  url: process.env.REDISCLIENTURI,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        console.error("Max reconnect attempts for Redis SubClient exceeded");
        return new Error("Max reconnect attempts for Redis SubClient exceeded");
      }
      console.log(`Redis SubClient reconnecting, attempt: ${retries}`);
      return Math.min(retries * 100, 3000); // Delay between retries
    },
  },
});

// Connection event handlers for pubClient
pubClient.on("connect", () => {
  console.log("Redis PubClient connected");
});

pubClient.on("ready", () => {
  console.log("Redis PubClient is ready");
});

pubClient.on("reconnecting", () => {
  console.log("Redis PubClient reconnecting...");
});

pubClient.on("error", (err: Error) => {
  console.error("Redis PubClient error:", err);
});

pubClient.on("end", () => {
  console.log("Redis PubClient connection closed");
});

// Connection event handlers for subClient
subClient.on("connect", () => {
  console.log("Redis SubClient connected");
});

subClient.on("ready", () => {
  console.log("Redis SubClient is ready");
});

subClient.on("reconnecting", () => {
  console.log("Redis SubClient reconnecting...");
});

subClient.on("error", (err: Error) => {
  console.error("Redis SubClient error:", err);
});

subClient.on("end", () => {
  console.log("Redis SubClient connection closed");
});

// Connect the clients
(async () => {
  try {
    await pubClient.connect();
    await subClient.connect();
    console.log("Redis pub/sub clients connected successfully");
  } catch (err) {
    console.error("Error connecting Redis clients:", err);
  }
})();

// Don't forget to export the clients if needed
export { pubClient, subClient };
