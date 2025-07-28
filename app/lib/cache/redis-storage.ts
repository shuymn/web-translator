import { createClient } from "redis";

// Type for the Redis client
type RedisClient = ReturnType<typeof createClient>;

// Redis configuration constants
const REDIS_CONNECTION_TIMEOUT_MS = 3000; // 3 seconds
const DEFAULT_CACHE_TTL_SECONDS = 604800; // 7 days

// Global instance for connection reuse (Vercel Fluid Compute optimization)
let globalRedisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (globalRedisClient?.isReady) {
    return globalRedisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      connectTimeout: REDIS_CONNECTION_TIMEOUT_MS,
      keepAlive: true,
    },
  });

  client.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  // Add timeout to connection attempt
  await Promise.race([
    client.connect(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Redis connection timeout")), REDIS_CONNECTION_TIMEOUT_MS),
    ),
  ]);
  globalRedisClient = client;

  return client;
}

// Simplified cache functions
export async function getCached(key: string): Promise<string | null> {
  try {
    const client = await getRedisClient();
    return await client.get(key);
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
}

export async function setCached(key: string, value: string, ttl: number = DEFAULT_CACHE_TTL_SECONDS): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.set(key, value, { EX: ttl });
  } catch (error) {
    console.error("Redis set error:", error);
    // Fail silently for cache writes
  }
}
