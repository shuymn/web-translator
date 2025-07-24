import { describe, expect, test } from "vitest";
import { generateCacheKey } from "./hash";

describe("Cache Utilities", () => {
  test("generates consistent cache keys", async () => {
    const key1 = await generateCacheKey("Hello World", "en", "ja");
    const key2 = await generateCacheKey("Hello World", "en", "ja");
    expect(key1).toBe(key2);
  });

  test("generates different keys for different inputs", async () => {
    const key1 = await generateCacheKey("Hello", "en", "ja");
    const key2 = await generateCacheKey("World", "en", "ja");
    expect(key1).not.toBe(key2);
  });

  test("generates different keys for different language pairs", async () => {
    const key1 = await generateCacheKey("Hello", "en", "ja");
    const key2 = await generateCacheKey("Hello", "ja", "en");
    expect(key1).not.toBe(key2);
  });

  test("normalizes input text", async () => {
    const key1 = await generateCacheKey("Hello", "en", "ja");
    const key2 = await generateCacheKey("hello", "en", "ja");
    const key3 = await generateCacheKey("  Hello  ", "en", "ja");
    expect(key1).toBe(key2);
    expect(key1).toBe(key3);
  });
});
