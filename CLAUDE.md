# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based translation application built with React Router v7 (SSR mode) deployed on Cloudflare Workers. It provides bidirectional English/Japanese translation using OpenAI's gpt-4.1-nano model with streaming responses and KV caching.

## Common Development Commands

```bash
# Development
pnpm dev                    # Start dev server (uses Vite + Cloudflare Workers)
pnpm build                  # Build for production (outputs to build/client and build/server)
pnpm deploy                 # Build and deploy to Cloudflare Workers

# Code Quality
pnpm lint                   # Run Biome linting with auto-fix
pnpm format                 # Run Biome formatting
pnpm typecheck              # Regenerate worker types and run TypeScript check

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Run tests in watch mode
pnpm test <file>            # Run specific test file

# Cloudflare Operations
pnpm exec wrangler secret put <name>  # Set secrets (OPENAI_API_KEY, CF_ACCOUNT_ID, AI_GATEWAY_ID)
pnpm exec wrangler kv namespace list  # List KV namespaces
pnpm exec wrangler tail               # Stream live logs from Workers
```

## Environment Setup

**KV Namespace Configuration**
This project dynamically manages KV namespace IDs to avoid committing them to the repository:

1. **Local Development**: Uses a placeholder KV namespace ID
   ```bash
   pnpm dev  # Automatically uses placeholder ID
   ```

2. **Deployment**: Dynamically fetches the actual KV namespace ID
   ```bash
   pnpm deploy  # Looks up KV namespace by name and uses real ID
   ```

3. **Custom KV Namespace Name** (optional):
   ```bash
   # Default name is "web-translator-cache"
   KV_NAME="my-custom-kv-namespace" pnpm deploy
   ```

**How it works**:
- `wrangler.jsonc` is generated from `wrangler.jsonnet` at runtime (requires jsonnet)
- Development commands use `development_placeholder_id` as the KV namespace ID
- Deploy command queries `wrangler kv namespace list` to find the actual ID
- The actual `wrangler.jsonc` is gitignored

**Creating a KV Namespace**:
If the deployment fails because the KV namespace doesn't exist, create it with:
```bash
pnpm exec wrangler kv namespace create "cache"  # Creates "web-translator-cache"
```

## Architecture Overview

### Application Flow
1. **Client Request** → React Router SSR renders the page
2. **Translation Request** → Client calls `/api/completion` endpoint
3. **Cache Check** → SHA-256 hash of normalized text used as cache key
4. **AI Gateway** → Routes OpenAI requests through Cloudflare AI Gateway for observability
5. **Streaming Response** → Uses Vercel AI SDK's streaming capabilities
6. **Cache Storage** → Successful translations stored in KV for 7 days

### Key Integration Points

**Cloudflare Environment Access**
- Available in route actions/loaders via `context.cloudflare.env`
- Contains KV namespace bindings and secrets
- Type definitions auto-generated in `worker-configuration.d.ts`

**AI Translation Pipeline**
```typescript
// 1. Create AI client with gateway
const openai = createAIGateway(env); // Uses Cloudflare AI Gateway URL

// 2. Stream translation
streamText({
  model: openai.responses("gpt-4.1-nano"),
  onFinish: async ({ text }) => {
    // 3. Cache result in KV
    await env.TRANSLATION_CACHE.put(cacheKey, text);
  }
});
```

### Project Structure Specifics

**React Router v7 Build Output**
- `build/client/` - Static assets served by Workers
- `build/server/` - SSR bundle loaded by worker entry point
- Assets configured in `wrangler.jsonc` to point to `build/client`

**Worker Entry Point**
- `workers/app.ts` - Minimal wrapper that loads React Router's server build
- Injects Cloudflare environment into React Router's context

**Type Generation**
- `pnpm typecheck` runs three steps:
  1. `wrangler types` - Generates `worker-configuration.d.ts` from `wrangler.jsonc`
  2. `react-router typegen` - Generates route types
  3. `tsc -b` - TypeScript validation

### Development Gotchas

**Environment Variables**
- Development: Create `.dev.vars` file (ignored by git)
- Production: Use `pnpm exec wrangler secret put` for sensitive values
- Build-time vars in `wrangler.jsonc` are placeholders

**KV Namespace Setup**
1. Create namespace: `pnpm exec wrangler kv namespace create TRANSLATION_CACHE`
2. Update the ID in `wrangler.jsonc` with returned value
3. For local dev, add `--local` flag to create preview namespace

**Streaming Responses**
- Cached responses must be wrapped in data stream format
- Use `createDataStreamResponse` and `formatDataStreamPart` for consistency
- Client uses `useCompletion` hook from AI SDK

**Git Hooks (Lefthook)**
- Pre-commit: Runs Biome checks
- Commit-msg: Validates conventional commit format (50 char limit)
- Errors are intentional - fix issues before committing

## Testing Approach

Tests use Vitest with jsdom environment. Focus areas:
- Cache key generation consistency
- Translation request handling
- Component rendering behavior

Run specific test: `pnpm test app/lib/cache.test.ts`