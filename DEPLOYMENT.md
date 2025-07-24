# Deployment Instructions for Web Translator

## Prerequisites
- Vercel account (free tier works)
- OpenAI API key with access to gpt-4.1-nano model
- Node.js and pnpm installed
- Docker (for local development)
- Redis instance (Vercel KV, Upstash, or self-hosted)

## Initial Setup

### 1. Fork/Clone Repository
```bash
git clone https://github.com/shuymn/web-translator.git
cd web-translator
pnpm install
```

### 2. Set Up Local Environment
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your credentials:
# OPENAI_API_KEY=your-openai-api-key
# REDIS_URL=redis://localhost:6379 (for local dev)
```

### 3. Start Local Redis
```bash
# Start Redis using Docker Compose
docker compose up -d

# Verify Redis is running
docker compose ps
```

## Vercel Deployment

### 1. Install Vercel CLI (Optional)
The project includes Vercel as a dev dependency, so you can use:
```bash
pnpm exec vercel
```

### 2. Initial Deployment
```bash
# Deploy to Vercel
pnpm deploy

# Or for preview deployment
pnpm deploy:preview
```

During first deployment, you'll be prompted to:
1. Log in to Vercel (if not already)
2. Link to existing project or create new
3. Configure project settings

### 3. Configure Environment Variables

#### Option A: Vercel Dashboard
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `REDIS_URL` - Your Redis connection URL

#### Option B: CLI
```bash
# Add environment variables via CLI
pnpm env:add OPENAI_API_KEY
pnpm env:add REDIS_URL
```

### 4. Redis Setup Options

#### Option 1: Vercel KV (Recommended)
1. In Vercel Dashboard, go to **Storage**
2. Click **Create Database** → **KV**
3. Follow the setup wizard
4. The `REDIS_URL` will be automatically added to your project

#### Option 2: Upstash Redis
1. Create account at [Upstash](https://upstash.com)
2. Create a new Redis database
3. Copy the Redis URL (with auth)
4. Add to Vercel environment variables

#### Option 3: Self-Hosted Redis
1. Deploy Redis on your infrastructure
2. Ensure it's accessible from Vercel Functions
3. Use connection URL with authentication

### 5. Configure Region (Important)
The project is configured to deploy to Tokyo (hnd1) region by default to avoid OpenAI API blocks in certain regions. This is set in `vercel.json`:

```json
{
  "regions": ["hnd1"]
}
```

You can change this to other regions if needed:
- `iad1` - Washington D.C. (US East)
- `sfo1` - San Francisco (US West)
- `fra1` - Frankfurt (Europe)
- `hnd1` - Tokyo (Asia)

### 6. Verify Deployment
1. Visit your deployment URL: `https://your-project.vercel.app`
2. Test translation functionality
3. Check function logs in Vercel Dashboard

## Environment Variables Summary

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for gpt-4.1-nano | Yes | `sk-...` |
| `REDIS_URL` | Redis connection URL with auth | Yes | `redis://default:password@host:6379` |

## Managing Deployments

### Production Deployments
```bash
# Deploy to production
pnpm deploy

# Or using Vercel CLI directly
pnpm exec vercel --prod
```

### Preview Deployments
```bash
# Create preview deployment
pnpm deploy:preview

# Or using Vercel CLI directly
pnpm exec vercel
```

### Pull Environment Variables
```bash
# Pull env vars from Vercel to local .env.local
pnpm env:pull
```

## Monitoring and Logs

### Function Logs
1. Go to Vercel Dashboard
2. Navigate to **Functions** tab
3. Click on `api/completion` function
4. View real-time logs and metrics

### Redis Monitoring
- **Vercel KV**: Monitor in Vercel Dashboard → Storage
- **Upstash**: Use Upstash Console for metrics
- **Self-hosted**: Use Redis CLI or monitoring tools

## Troubleshooting

### Function Timeout
- Default timeout is 30 seconds (configured in `vercel.json`)
- If translations timeout, check OpenAI API response times

### Redis Connection Issues
1. Verify `REDIS_URL` is correctly set
2. Check Redis service is running and accessible
3. Ensure connection URL includes authentication
4. Check function logs for connection errors

### OpenAI API Issues
1. Verify API key has access to gpt-4.1-nano model
2. Check OpenAI API status
3. Monitor rate limits in OpenAI Dashboard
4. Check function logs for API errors

### Caching Issues
- Translations are cached for 7 days
- Cache key is based on normalized text + language pair
- To clear cache:
  - **Vercel KV**: Use Vercel Dashboard
  - **Upstash**: Use Upstash Console
  - **Self-hosted**: Use Redis CLI (`FLUSHDB`)

### Build Failures
1. Check build logs in Vercel Dashboard
2. Ensure all dependencies are installed
3. Run `pnpm build` locally to test
4. Check for TypeScript errors: `pnpm typecheck`

## Performance Optimization

### Connection Reuse
The app uses a global Redis client pattern to reuse connections across function invocations, leveraging Vercel's Fluid Compute optimization.

### Regional Deployment
Deploy to regions close to your users and Redis instance for optimal latency.

### Monitoring
- Use Vercel Analytics for performance insights
- Monitor Redis latency and connection count
- Track OpenAI API response times

## Security Considerations

1. **API Keys**: Never commit API keys to repository
2. **Redis Security**: Use strong passwords and TLS connections
3. **Environment Variables**: Use Vercel's encrypted storage
4. **Access Control**: Consider implementing authentication if needed