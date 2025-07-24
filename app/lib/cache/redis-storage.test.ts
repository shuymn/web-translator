import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getCached, getRedisClient, setCached } from "./redis-storage";

describe("Redis Storage", () => {
  let client: ReturnType<typeof getRedisClient> extends Promise<infer T> ? T : never;

  beforeAll(async () => {
    // Ensure Redis is available for tests
    client = await getRedisClient();
  });

  afterAll(async () => {
    if (client) await client.quit();
  });

  test("should store and retrieve values", async () => {
    const key = "test-key";
    const value = "test-value";

    await setCached(key, value, 60);
    const retrieved = await getCached(key);

    expect(retrieved).toBe(value);

    // Cleanup
    await client.del(key);
  });

  test("should return null for non-existent keys", async () => {
    const result = await getCached("non-existent-key");
    expect(result).toBeNull();
  });

  test("should handle errors gracefully", async () => {
    // Save original Redis URL
    const originalUrl = process.env.REDIS_URL;

    // Test with invalid Redis URL
    process.env.REDIS_URL = "redis://invalid:6379";

    const result = await getCached("any-key");
    expect(result).toBeNull(); // Should fail silently

    // Restore original URL
    process.env.REDIS_URL = originalUrl;
  });
});
