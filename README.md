# Web Translator

A modern web-based translation application built with React Router v7 and deployed on Vercel. Features bidirectional English/Japanese translation powered by OpenAI's gpt-4.1-nano model with streaming responses and intelligent caching.

## Features

- 🌐 **Bidirectional Translation**: Seamlessly translate between English and Japanese
- ⚡ **Streaming Responses**: Real-time translation output as it's generated
- 💾 **Smart Caching**: 7-day cache using Redis to minimize API calls
- 🎨 **Markdown Support**: Client-side markdown preview with syntax highlighting
- 🌙 **Dark Theme**: Beautiful gradient interface optimized for readability
- 🚀 **Edge Deployment**: Deployed on Vercel with Tokyo region for optimal performance
- 🔄 **Connection Reuse**: Optimized Redis connections with Vercel Fluid Compute

## Tech Stack

- **Framework**: React Router v7 (formerly Remix)
- **Runtime**: Vercel Functions with SSR
- **AI Model**: OpenAI gpt-4.1-nano via Vercel AI SDK
- **Styling**: Tailwind CSS + shadcn/ui components
- **Syntax Highlighting**: Shiki.js
- **Package Manager**: pnpm
- **Linting/Formatting**: Biome

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker (for local Redis development)
- Vercel account
- OpenAI API key
- Redis instance (Vercel KV, Upstash, or self-hosted)

## Installation

```bash
# Install dependencies
pnpm install

# Set up local development environment
cp .env.example .env.local
# Edit .env.local with your OpenAI API key and Redis URL

# Start local Redis (optional, for local development)
docker compose up -d

# Pull environment variables from Vercel (after initial deployment)
pnpm env:pull
```

## Development

```bash
# Start development server
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format

# Run tests (requires Redis running)
pnpm test

# Run type checking
pnpm typecheck
```

## Building and Deployment

```bash
# Build for production
pnpm build

# Deploy to Vercel (production)
pnpm deploy

# Deploy preview version
pnpm deploy:preview

# Add environment variables
pnpm env:add
```

## Configuration

### Vercel Configuration

The project is configured with:
- **Region**: Tokyo (hnd1) for optimal performance in Asia
- **Function Timeout**: 30 seconds for API routes
- **Environment Variables**: Managed through Vercel Dashboard

### Redis Configuration

**Local Development**:
- Uses Docker Compose with Redis 7 Alpine
- Automatically connects to `redis://localhost:6379`

**Production**:
- Supports any Redis-compatible service (Vercel KV, Upstash, etc.)
- Configure `REDIS_URL` in Vercel Dashboard

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for gpt-4.1-nano | Yes |
| `REDIS_URL` | Redis connection URL | Yes |

## Project Structure

```
├── app/                    # React Router application
│   ├── components/         # UI components
│   ├── lib/               # Utilities and helpers
│   │   └── cache/        # Redis cache implementation
│   ├── routes/            # Route components
│   └── root.tsx           # Root layout
├── build/                 # Production build output
├── public/                # Static assets
├── specs/                 # Project specifications
├── biome.json            # Biome configuration
├── compose.yaml          # Docker Compose for Redis
├── vercel.json           # Vercel configuration
└── vite.config.ts        # Vite configuration
```

## Architecture

The application uses React Router v7's server-side rendering capabilities with Vercel Functions. Translations are processed server-side using the Vercel AI SDK with streaming support, while markdown rendering and syntax highlighting happen client-side for optimal performance.

### Key Design Decisions

- **Streaming Architecture**: Utilizes AI SDK's `useCompletion` hook for seamless streaming
- **Redis Caching**: Fast in-memory caching with connection reuse
- **Client-side Preview**: Markdown rendering on client to reduce server load
- **Singleton Highlighter**: Shiki.js instance cached to prevent re-initialization
- **Fixed Region Deployment**: Tokyo region for consistent performance and avoiding API blocks

## Testing

The project uses Vitest for unit testing:

```bash
# Start Redis for tests (if not already running)
docker compose up -d

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test app/lib/cache/hash.test.ts
```

**GitHub Actions**: Tests run automatically on push/PR with Redis service container.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Initial prototype created with v0
- Built with React Router v7 and Vercel
- UI components from shadcn/ui
- Translation powered by OpenAI
