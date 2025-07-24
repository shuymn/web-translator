# Deployment Instructions for Web Translator

## Prerequisites
- Cloudflare account with Workers enabled
- OpenAI API key with access to gpt-4.1-nano model
- Node.js and pnpm installed

## Phase 7: Deployment Preparation

### 1. Create KV Namespace
```bash
pnpm exec wrangler kv namespace create web-translator-cache
```

After running this command, you'll receive output like:
```
 ⛅️ wrangler 4.x.x
------------------------------------------------
Add the following to your configuration file in your kv_namespaces array:
[[kv_namespaces]]
binding = "TRANSLATION_CACHE"
id = "abcd1234567890"
```

**Note**: The deployment process will automatically fetch the KV namespace ID by name. No manual configuration needed!

### 2. Set Worker Secrets
```bash
# Set your OpenAI API key
pnpm exec wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted

# Set your Cloudflare Account ID
pnpm exec wrangler secret put CF_ACCOUNT_ID
# Enter your Cloudflare account ID (found in dashboard)

# Set your AI Gateway ID
pnpm exec wrangler secret put AI_GATEWAY_ID
# Enter your AI Gateway ID (created in next step)
```

### 3. Configure AI Gateway
1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **AI > AI Gateway**
3. Click **Create Gateway**
4. Enter details:
   - Gateway name: `web-translator`
   - Description: "AI Gateway for Web Translator"
5. Click **Create**
6. Copy the Gateway ID and use it in the secret above

### 4. Configure Cloudflare Access (Optional)
To protect your application with email-based authentication:

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Zero Trust > Access > Applications**
3. Click **Add an application** and select **Self-hosted**
4. Configure:
   - **Application name**: Web Translator
   - **Application domain**: `web-translator.yourdomain.com`
   - **Identity providers**: Choose your preferred method
5. Create an access policy:
   - **Policy name**: Personal Access
   - **Action**: Allow
   - **Include**: Email equals `your-email@example.com`
6. Save the application

### 5. Deploy the Application
```bash
# Build and deploy to Cloudflare Workers
pnpm deploy
```

### 6. Verify Deployment
1. Visit your worker URL: `https://web-translator.YOUR-SUBDOMAIN.workers.dev`
2. If using Cloudflare Access, you'll be prompted to authenticate
3. Test translation functionality

## Environment Variables Summary

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key for gpt-4.1-nano model | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `CF_ACCOUNT_ID` | Your Cloudflare Account ID | Cloudflare Dashboard > Right sidebar |
| `AI_GATEWAY_ID` | AI Gateway ID | AI > AI Gateway in Cloudflare Dashboard |

## Troubleshooting

### KV Namespace Issues
- Ensure the KV namespace exists with name `web-translator-cache` (or your custom name)
- Use `pnpm exec wrangler kv namespace list` to verify
- Check that the binding name is exactly `TRANSLATION_CACHE`

### AI Gateway Issues
- Verify the AI Gateway URL format: `https://gateway.ai.cloudflare.com/v1/{CF_ACCOUNT_ID}/{AI_GATEWAY_ID}/openai`
- Check AI Gateway logs in Cloudflare Dashboard for request errors

### Translation Not Working
1. Check worker logs: `pnpm exec wrangler tail`
2. Verify all secrets are set correctly
3. Ensure OpenAI API key has access to gpt-4.1-nano model
4. Check AI Gateway logs for API errors

### Caching Issues
- Translations are cached for 7 days
- Cache key is based on normalized text + language pair
- To clear cache, use Cloudflare Dashboard > Workers & Pages > KV
