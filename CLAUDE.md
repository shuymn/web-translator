# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based translation application built with React Router v7 (SSR mode) deployed on Vercel. It provides bidirectional English/Japanese translation using OpenAI's gpt-oss-120b model via OpenRouter with streaming responses and Redis caching.

## Common Development Commands

```bash
# Development
pnpm dev                    # Start dev server (uses Vite)
pnpm build                  # Build for production (outputs to build/client and build/server)
pnpm deploy                 # Deploy to Vercel (production)
pnpm deploy:preview         # Deploy preview version

# Code Quality
pnpm lint                   # Run Biome linting with auto-fix
pnpm format                 # Run Biome formatting
pnpm typecheck              # Run TypeScript check

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test <file>            # Run specific test file

# Vercel Operations
pnpm env:pull               # Pull environment variables from Vercel
pnpm env:add                # Add new environment variable
pnpm exec vercel --prod     # Deploy to production
pnpm exec vercel            # Deploy preview
```

## Environment Setup

**Redis Configuration**
This project uses Redis for caching translations:

1. **Local Development**: Use Docker Compose for local Redis
   ```bash
   docker compose up -d  # Starts Redis on localhost:6379
   pnpm dev             # Connects to local Redis
   ```

2. **Production**: Configure Redis URL in Vercel Dashboard
   - Can use Vercel KV, Upstash, or any Redis-compatible service
   - Set `REDIS_URL` environment variable

**Environment Variables**:
- Development: Create `.env.local` file from `.env.example`
- Production: Configure in Vercel Dashboard
- Pull from Vercel: `pnpm env:pull`

## Architecture Overview

### Application Flow
1. **Client Request** → React Router SSR renders the page
2. **Translation Request** → Client calls `/api/completion` endpoint
3. **Cache Check** → SHA-256 hash of normalized text used as cache key
4. **API Call via OpenRouter** → Routes request to OpenAI's gpt-oss-120b model through OpenRouter
5. **Streaming Response** → Uses Vercel AI SDK's streaming capabilities
6. **Cache Storage** → Successful translations stored in Redis for 7 days

### Key Integration Points

**Environment Access**
- Environment variables available via `process.env`
- Managed through Vercel Dashboard
- Local development uses `.env.local`

**AI Translation Pipeline**
```typescript
// 1. Create OpenRouter client
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// 2. Stream translation with provider configuration
streamText({
  model: openrouter("openai/gpt-oss-120b", {
    provider: {
      order: ["cerebras", "groq"],
      only: ["cerebras", "groq"],
      data_collection: "deny",
      sort: "throughput",
      allow_fallbacks: false,
    },
  }),
  onFinish: async ({ text }) => {
    // 3. Cache result in Redis
    await setCached(cacheKey, text, 604800); // 7 days
  }
});
```

### Project Structure Specifics

**React Router v7 Build Output**
- `build/client/` - Static assets served by Vercel
- `build/server/` - SSR bundle for Vercel Functions
- Vercel preset handles the integration automatically

**Redis Cache Module**
- `app/lib/cache/redis-storage.ts` - Redis client with connection reuse
- `app/lib/cache/hash.ts` - Cache key generation
- Global Redis client pattern for Vercel Fluid Compute optimization

**Type Generation**
- `pnpm typecheck` runs two steps:
  1. `react-router typegen` - Generates route types
  2. `tsc -b` - TypeScript validation

### Development Gotchas

**Environment Variables**
- Development: Create `.env.local` file from `.env.example`
- Production: Configure in Vercel Dashboard
- Never commit `.env.local` or any `.env.*` files

**Redis Connection**
- Uses global client pattern for connection reuse
- Vercel Fluid Compute keeps connections warm between invocations
- Local development requires Docker or external Redis

**Streaming Responses**
- Cached responses must be wrapped in data stream format
- Use `createDataStreamResponse` and `formatDataStreamPart` for consistency
- Client uses `useCompletion` hook from AI SDK

**Git Hooks (Lefthook)**
- Pre-commit: Runs Biome checks
- Commit-msg: Validates conventional commit format (50 char limit)
- Errors are intentional - fix issues before committing

**Vercel Region**
- Fixed to Tokyo (hnd1) for optimal performance in Asia
- Ensures consistent latency and performance
- OpenRouter handles provider selection and fallbacks

## Testing Approach

Tests use Vitest with jsdom environment. Focus areas:
- Cache key generation consistency
- Redis storage operations
- Translation request handling
- Component rendering behavior

**Local Testing**:
```bash
# Start Redis
docker compose up -d

# Run tests
pnpm test app/lib/cache/hash.test.ts
```

**CI Testing**:
- GitHub Actions runs tests with Redis service container
- No additional setup needed