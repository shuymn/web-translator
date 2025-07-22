# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Run production build
pnpm start

# Run linting
pnpm lint
```

## Architecture Overview

This is a Next.js 15 web application for text translation with Markdown preview support. The project uses:

- **Next.js 15.2.4** with React 19 and App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components (located in `components/ui/`)
- **pnpm** as package manager

## Key Implementation Details

### Translation Interface

The main translation interface is in `app/page.tsx`. Currently uses mock translation - the `handleTranslate` function (line 21) needs to be integrated with a real translation API.

### Component Architecture

- All UI components are from shadcn/ui library in `components/ui/`
- Theme provider setup in `components/theme-provider.tsx`
- Components use Radix UI primitives with custom styling

### Build Configuration

The project has ESLint and TypeScript errors disabled during builds (see `next.config.mjs`):
- `eslint.ignoreDuringBuilds: true`
- `typescript.ignoreBuildErrors: true`

Consider enabling these checks once the project stabilizes.

### Current State

The application has:
- Bilingual interface (English ↔ Japanese)
- Language swap functionality
- Markdown preview for translated text
- Copy to clipboard feature
- Mock translation implementation

The mock translation returns hardcoded Japanese text - replace this with actual API integration.