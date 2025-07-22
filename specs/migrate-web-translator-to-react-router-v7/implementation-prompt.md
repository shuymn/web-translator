# Implementation Prompt for Web Translator Migration

## Context
I have completed the planning phase for migrating a web translator from Next.js to React Router v7 on Cloudflare Workers. All specifications are ready:

- Requirements: `./specs/migrate-web-translator-to-react-router-v7/requirements.md`
- Design: `./specs/migrate-web-translator-to-react-router-v7/design.md`
- Implementation Plan: `./specs/migrate-web-translator-to-react-router-v7/implementation-plan.md`
- v0 Prototype Code: `./v0-prototype/` (if available - contains the original Next.js implementation for visual/component reference)

## Implementation Request

Please implement the web translator migration following the implementation plan. The project should:

1. **Follow the 8-phase implementation plan** in order
2. **Use pnpm** as the package manager (not npm)
3. **Use Biome** for linting/formatting (not ESLint/Prettier)
4. **Avoid path aliases** - use relative imports only
5. **Keep it simple** - this is a personal project

## Key Features to Implement

1. **Core Setup**:
   - React Router v7 with Cloudflare Workers
   - TypeScript configuration
   - Biome setup

2. **Translation Service**:
   - OpenAI o4-mini model via Vercel AI SDK
   - Streaming responses with `@ai-sdk/react`
   - Cloudflare KV caching (7-day TTL)
   - AI Gateway integration

3. **UI Components**:
   - Preserve v0 prototype design (dark theme, gradient background)
   - shadcn/ui components
   - Markdown preview with Shiki.js syntax highlighting
   - Desktop-only (no mobile support needed)

4. **Testing**:
   - Vitest with Cloudflare Workers pool
   - Basic tests only (personal project)

## Important Notes

- **Start with Phase 1**: Create the project using `pnpm create cloudflare@latest web-translator --framework=react-router`
- **Reference the v0 prototype code** if provided in `./v0-prototype/` directory for UI styling and component structure
- **Skip deployment steps** - I'll handle deployment myself
- **Create all files in the correct locations** as specified in the plan
- **Test locally** with `pnpm dev` to ensure everything works

## Expected Outcome

A working web translator application that:
- Translates between English and Japanese
- Shows streaming translation output
- Caches translations for efficiency
- Matches the v0 prototype's visual design
- Runs on Cloudflare Workers with React Router v7

Please proceed with the implementation following the plan phases in order.