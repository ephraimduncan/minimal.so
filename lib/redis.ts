import Redis from "ioredis";

declare global {
  var redis: Redis | undefined;
}

function createRedisClient() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL environment variable is not set");
  }
  return new Redis(url);
}

const redisClient = globalThis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.redis = redisClient;
}

export const redis = redisClient;
