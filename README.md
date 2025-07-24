# Web Translator

A modern web-based translation application built with React Router v7 and deployed on Cloudflare Workers. Features bidirectional English/Japanese translation powered by OpenAI's gpt-4.1-nano model with streaming responses and intelligent caching.

## Features

- 🌐 **Bidirectional Translation**: Seamlessly translate between English and Japanese
- ⚡ **Streaming Responses**: Real-time translation output as it's generated
- 💾 **Smart Caching**: 7-day cache using Cloudflare KV to minimize API calls
- 🎨 **Markdown Support**: Client-side markdown preview with syntax highlighting
- 🌙 **Dark Theme**: Beautiful gradient interface optimized for readability
- 🔒 **Secure Access**: Protected with Cloudflare Access (single-user)
- 📊 **AI Gateway Integration**: Request monitoring and observability

## Tech Stack

- **Framework**: React Router v7 (formerly Remix)
- **Runtime**: Cloudflare Workers with Static Assets
- **AI Model**: OpenAI gpt-4.1-nano via Vercel AI SDK
- **Styling**: Tailwind CSS + shadcn/ui components
- **Syntax Highlighting**: Shiki.js
- **Package Manager**: pnpm
- **Linting/Formatting**: Biome

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- jsonnet (`brew install go-jsonnet` on macOS, or see [installation guide](https://github.com/google/go-jsonnet/releases))
- Cloudflare account with Workers enabled
- OpenAI API key
- Wrangler CLI (`pnpm install -g wrangler`)

## Installation

```bash
# Install dependencies
pnpm install

# Create KV namespace
pnpm exec wrangler kv namespace create "cache"
# This creates a namespace with the prefix "web-translator"
# The deployment process will automatically fetch the KV namespace ID

# Set secrets
pnpm exec wrangler secret put OPENAI_API_KEY
pnpm exec wrangler secret put CF_ACCOUNT_ID
pnpm exec wrangler secret put AI_GATEWAY_ID
```

## Development

```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

## Building and Deployment

```bash
# Build for production
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy

# Deploy preview version
pnpm exec wrangler versions upload

# Promote version to production
pnpm exec wrangler versions deploy
```

## Configuration

### Wrangler Configuration (Auto-generated)

The project uses a dynamic configuration system:
- `wrangler.jsonnet` is the source configuration template
- `wrangler.jsonc` is auto-generated from the template (gitignored)
- Local development uses placeholder KV namespace IDs
- Deployment automatically fetches real KV namespace IDs by name

**Note**: Never edit `wrangler.jsonc` directly. All configuration changes should be made in `wrangler.jsonnet`.

### Cloudflare AI Gateway

1. Log into Cloudflare Dashboard
2. Navigate to AI → AI Gateway
3. Create a new gateway named "web-translator"
4. Note the gateway ID for configuration

### Cloudflare Access (Optional)

1. Navigate to Zero Trust → Access → Applications
2. Create a self-hosted application
3. Set up email-based access policy
4. Configure your domain

## Project Structure

```
├── app/                    # React Router application
│   ├── components/         # UI components
│   ├── lib/               # Utilities and helpers
│   ├── routes/            # Route components
│   └── root.tsx           # Root layout
├── workers/               # Cloudflare Worker entry
├── build/                 # Production build output
├── public/                # Static assets
├── specs/                 # Project specifications
├── biome.json            # Biome configuration
├── wrangler.jsonnet      # Wrangler config template (source)
├── wrangler.jsonc        # Auto-generated config (gitignored)
└── vite.config.ts        # Vite configuration
```

## Architecture

The application uses React Router v7's server-side rendering capabilities with Cloudflare Workers for edge computing. Translations are processed server-side using the Vercel AI SDK with streaming support, while markdown rendering and syntax highlighting happen client-side for optimal performance.

### Key Design Decisions

- **Streaming Architecture**: Utilizes AI SDK's `useCompletion` hook for seamless streaming
- **Edge Caching**: KV storage at Cloudflare edge locations for low-latency cache hits
- **Client-side Preview**: Markdown rendering on client to reduce server load
- **Singleton Highlighter**: Shiki.js instance cached to prevent re-initialization

## Testing

The project uses Vitest with Cloudflare Workers test environment:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test app/routes/home.test.tsx
```

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Initial prototype created with v0
- Built with React Router v7 and Cloudflare Workers
- UI components from shadcn/ui
- Translation powered by OpenAI
