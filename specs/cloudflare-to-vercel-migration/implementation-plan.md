# Implementation Plan for Cloudflare to Vercel Migration

## Overview
This plan outlines the step-by-step implementation for migrating the web-translator application from Cloudflare Workers to Vercel with Redis caching.

## Phase 1: Environment Setup (30 minutes)

### 1.1 Install Dependencies
```bash
pnpm add @vercel/react-router redis
pnpm add -D @types/node vercel
```

### 1.2 Create Environment Files
- Create `.env.local` with development values
- Create `.env.production` as a template (empty values)
- Add `.env.local` to `.gitignore` if not already present

## Phase 2: Local Development Setup (15 minutes)

### 2.1 Create Docker Compose Configuration
- Create `compose.yaml` with Redis service
- Configure Redis with persistence

### 2.2 Start Local Redis
```bash
docker compose up -d
```

### 2.3 Verify Redis Connection
```bash
docker compose exec redis redis-cli ping
# Should return: PONG
```

## Phase 3: Cache Layer Implementation (30 minutes)

### 3.1 Implement Redis Storage
- Create `app/lib/cache/redis-storage.ts`
- Add simple getCached/setCached functions
- Include error handling for graceful degradation

### 3.2 Move Existing Cache Logic
- Move `app/lib/cache.ts` to `app/lib/cache/hash.ts`
- Update imports

## Phase 4: Configuration Setup (20 minutes)

### 4.1 Add Vercel Configuration
- Create `vercel.json` with region pinning
- Configure build settings
- Add function-specific settings

### 4.2 Update React Router Configuration
- Create `react-router.config.ts`
- Add Vercel preset
- Ensure SSR is enabled

## Phase 5: Route Handler Updates (30 minutes)

### 5.1 Update API Completion Route
- Modify `app/routes/api.completion.tsx`
- Replace Cloudflare KV with Redis functions
- Remove Cloudflare AI Gateway references
- Use direct OpenAI client with process.env

### 5.2 Update Environment Access
- Replace `context.cloudflare.env` with `process.env`
- Ensure all environment variables use standard Node.js pattern

## Phase 6: Cleanup Cloudflare Dependencies (20 minutes)

### 6.1 Remove Cloudflare-specific Files
- Delete `app/entry.server.tsx`
- Delete `workers/app.ts`
- Delete `wrangler.jsonc`
- Delete `wrangler.jsonnet`
- Delete `.dev.vars` (if exists)

### 6.2 Update Package Scripts
- Remove Cloudflare-specific scripts
- Add Vercel deployment scripts
- Update build commands

### 6.3 Clean Dependencies
- Remove `@cloudflare/workers-types`
- Remove `wrangler`
- Remove other Cloudflare-specific packages

## Phase 7: Testing Implementation (45 minutes)

### 7.1 Update Unit Tests
Update `app/lib/cache.test.ts` to test the hash function after moving it:
```typescript
// app/lib/cache/hash.test.ts
import { describe, expect, test } from "vitest";
import { generateCacheKey } from "./hash";

describe("generateCacheKey", () => {
  test("should generate consistent hash for same inputs", async () => {
    const key1 = await generateCacheKey("Hello", "en", "ja");
    const key2 = await generateCacheKey("Hello", "en", "ja");
    expect(key1).toBe(key2);
  });
  
  test("should generate different hashes for different inputs", async () => {
    const key1 = await generateCacheKey("Hello", "en", "ja");
    const key2 = await generateCacheKey("Hello", "en", "es");
    expect(key1).not.toBe(key2);
  });
});
```

### 7.2 Create Integration Tests
Create Redis storage tests:
```typescript
// app/lib/cache/redis-storage.test.ts
import { describe, expect, test, beforeAll, afterAll } from "vitest";
import { getCached, setCached, getRedisClient } from "./redis-storage";

describe("Redis Storage", () => {
  let client;
  
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
    // Test with invalid Redis URL
    process.env.REDIS_URL = "redis://invalid:6379";
    
    const result = await getCached("any-key");
    expect(result).toBeNull(); // Should fail silently
  });
});
```

### 7.3 Update GitHub Actions Workflow
Create `.github/workflows/test.yml`:
```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      
      - name: Run tests
        run: pnpm test
        env:
          REDIS_URL: redis://localhost:6379
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 7.4 Local Testing & Verification

#### 7.4.1 Unit Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test app/lib/cache/hash.test.ts
pnpm test app/lib/cache/redis-storage.test.ts
```

#### 7.4.2 Local Development Test
```bash
# Set up environment
cp .env.production .env.local
# Add actual values to .env.local

# Start Redis
docker compose up -d

# Run development server
pnpm dev
```

#### 7.4.3 Build Verification
```bash
pnpm build
```

#### 7.4.4 Vercel Local Test
```bash
pnpm exec vercel dev
```

#### 7.4.5 Manual Function Testing
- Test translation endpoint with curl:
```bash
curl -X POST http://localhost:3000/api/completion \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","sourceLang":"en","targetLang":"ja"}'
```
- Verify Redis caching by checking repeated requests are faster
- Test error handling by stopping Redis and verifying graceful degradation

## Phase 8: Deployment (20 minutes)

### 8.1 Set Environment Variables
```bash
pnpm exec vercel env add OPENAI_API_KEY
pnpm exec vercel env add REDIS_URL
```

### 8.2 Deploy Preview
```bash
pnpm exec vercel
```

### 8.3 Test Preview Deployment
- Test all functionality
- Verify region is correct
- Check Redis connectivity

### 8.4 Deploy Production
```bash
pnpm exec vercel --prod
```

## File-by-File Changes

### New Files to Create:
1. `app/lib/cache/redis-storage.ts`
2. `app/lib/cache/redis-storage.test.ts`
3. `compose.yaml`
4. `vercel.json`
5. `react-router.config.ts`
6. `.github/workflows/test.yml`
7. `.env.local` (development only)
8. `.env.production` (template)

### Files to Modify:
1. `app/routes/api.completion.tsx` - Update to use new cache and config
2. `package.json` - Update scripts and dependencies
3. `.gitignore` - Ensure `.env.local` is ignored

### Files to Move/Update:
1. `app/lib/cache.ts` → `app/lib/cache/hash.ts`
2. `app/lib/cache.test.ts` → `app/lib/cache/hash.test.ts` (update imports)

### Files to Delete:
1. `app/entry.server.tsx`
2. `workers/app.ts`
3. `wrangler.jsonc`
4. `wrangler.jsonnet`
5. `.dev.vars` (if exists)

## Success Verification Checklist

- [ ] Application builds successfully
- [ ] Local development works with Docker Redis
- [ ] All tests pass locally and in CI
- [ ] GitHub Actions workflow runs successfully
- [ ] Redis connection established in both environments
- [ ] Translation API returns responses
- [ ] Caching reduces API calls on repeated translations
- [ ] Deployment region is fixed to `iad1`
- [ ] No Cloudflare-specific code remains
- [ ] Environment variables are properly configured
- [ ] All dependencies are updated

## Estimated Total Time: 3-3.5 hours

The simplified implementation significantly reduces complexity by:
- Using Docker Compose for local Redis (no in-memory fallback needed)
- Direct Redis functions instead of abstraction layers
- Standard process.env instead of custom config
- Fewer files to create and maintain