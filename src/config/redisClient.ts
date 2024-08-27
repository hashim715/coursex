import { createClient, RedisClientType } from "redis";

const redisClient: RedisClientType = createClient({
  url: `redis://${process.env.REDISCLIENTURI}`,
});

redisClient.on("connect", () => {
  console.log("redisClient connected");
});

redisClient.on("ready", () => {
  console.log("redisClient is ready");
});

redisClient.on("reconnecting", () => {
  console.log("redisClient reconnecting...");
});

redisClient.on("error", (err: Error) => {
  console.error("redisClient error:", err);
});

redisClient.on("end", () => {
  console.log("redisClient connection closed");
});

(async () => {
  try {
    await redisClient.connect();
    console.log("redisclients connected successfully");
  } catch (err) {
    console.error("Error connecting redisClients:", err);
  }
})();

export { redisClient };
