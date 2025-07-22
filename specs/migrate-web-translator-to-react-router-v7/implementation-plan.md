# Implementation Plan: Web Translator Migration to React Router v7

## Overview
This plan outlines the step-by-step migration of the web translator from Next.js to React Router v7 on Cloudflare Workers, preserving the v0 prototype's design while implementing modern streaming capabilities.

## Prerequisites
- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Cloudflare account with Workers enabled
- OpenAI API key
- Wrangler CLI installed (`pnpm install -g wrangler`)

## Implementation Phases

### Phase 1: Project Setup and Configuration
**Estimated Time: 30 minutes**

#### 1.1 Create New React Router v7 Project
```bash
pnpm create cloudflare@latest web-translator --framework=react-router
# Select TypeScript when prompted
# Select Cloudflare Workers as deployment target
```

#### 1.2 Install Dependencies
```bash
cd web-translator
pnpm add ai @ai-sdk/openai @ai-sdk/react
pnpm add shiki @shikijs/rehype react-markdown remark-gfm
pnpm add @shikijs/themes @shikijs/langs
pnpm add lucide-react clsx tailwind-merge
pnpm add -D @types/react @types/react-dom biome
```

#### 1.3 Configure Biome
Create `biome.json`:
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

Update `package.json` scripts:
```json
{
  "scripts": {
    "lint": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

#### 1.4 Configure Wrangler
Update `wrangler.jsonc`:
```jsonc
{
  "name": "web-translator",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./workers/app.ts",
  
  "kv_namespaces": [
    {
      "binding": "TRANSLATION_CACHE",
      "id": "PLACEHOLDER_WILL_BE_CREATED"
    }
  ],
  
  "ai": {
    "binding": "AI"
  }
}
```

### Phase 2: shadcn/ui Setup
**Estimated Time: 20 minutes**

#### 2.1 Initialize shadcn/ui
```bash
pnpm dlx shadcn@latest init
# Choose: TypeScript, Tailwind CSS variables, dark mode
```

#### 2.2 Install Required Components
```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add alert
```

#### 2.3 Configure Dark Theme
Update `app/tailwind.css` to match v0 prototype colors:
```css
@layer base {
  :root {
    --background: 210 20% 4%;
    --foreground: 0 0% 100%;
    --card: 210 20% 8%;
    --primary: 217 91% 60%;
    --secondary: 270 50% 60%;
    /* ... other variables */
  }
}
```

### Phase 3: Core Application Structure
**Estimated Time: 45 minutes**

**Note**: React Router v7 uses route configuration in `app/routes.ts` instead of file-based routing. Type imports are generated per-route (e.g., `./+types.home` for the home route).

#### 3.1 Create Worker Entry Point
Create `workers/app.ts`:
```typescript
import { createRequestHandler } from "react-router";
import type { Env } from "../app/types/env";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return requestHandler(request, {
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
```

#### 3.2 Create Environment Types
Create `app/types/env.ts`:
```typescript
export interface Env {
  TRANSLATION_CACHE: KVNamespace;
  OPENAI_API_KEY: string;
  CF_ACCOUNT_ID: string;
  AI_GATEWAY_ID: string;
}
```

**Important**: Remove any path aliases from `tsconfig.json` if they exist. Use relative imports instead of aliases like `~/`.

#### 3.3 Create Routes Configuration
Create `app/routes.ts`:
```typescript
import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("api/completion", "./routes/api/completion.tsx"),
] satisfies RouteConfig;
```

#### 3.4 Update React Router Config
Update `react-router.config.ts`:
```typescript
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    // Required for Cloudflare Vite plugin integration
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
```

**Note about unstable flags**:
- `unstable_viteEnvironmentApi`: Required flag that enables React Router to work with Vite's environment API, allowing proper integration with Cloudflare Workers runtime
- These "unstable" flags will be stabilized in future releases but are currently necessary for Cloudflare deployment

### Phase 4: Translation Service Implementation
**Estimated Time: 60 minutes**

#### 4.1 Create AI Gateway Configuration
Create `app/lib/ai-gateway.ts`:
```typescript
import { createOpenAI } from "@ai-sdk/openai";
import type { Env } from "../types/env";

export function createAIGateway(env: Env) {
  return createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/openai`,
  });
}
```

#### 4.2 Create Cache Utilities
Create `app/lib/cache.ts`:
```typescript
export function generateCacheKey(
  text: string,
  sourceLang: string,
  targetLang: string
): string {
  const normalized = text.trim().toLowerCase();
  const hash = btoa(normalized).replace(/[^a-zA-Z0-9]/g, "");
  return `translate:${sourceLang}:${targetLang}:${hash}`;
}
```

#### 4.3 Create API Completion Route
Create `app/routes/api/completion.tsx`:
```typescript
import { streamText } from "ai";
import type { Route } from "./+types.completion";
import { createAIGateway } from "../../lib/ai-gateway";
import { generateCacheKey } from "../../lib/cache";

export async function action({ request, context }: Route.ActionArgs) {
  const { prompt, sourceLang, targetLang } = await request.json();
  const env = context.cloudflare.env;
  
  // Check cache
  const cacheKey = generateCacheKey(prompt, sourceLang, targetLang);
  const cached = await env.TRANSLATION_CACHE.get(cacheKey);
  
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  
  // Create AI client
  const openai = createAIGateway(env);
  
  // Stream translation
  const result = await streamText({
    model: openai("o4-mini"),
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}. 
                 Preserve all markdown formatting, code blocks, and special characters exactly as they appear.
                 Provide only the translation without any explanations or notes.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    maxTokens: 4096,
    onFinish: async ({ text }) => {
      await env.TRANSLATION_CACHE.put(cacheKey, text, {
        expirationTtl: 604800, // 7 days
      });
    },
  });
  
  return result.toDataStreamResponse();
}
```

### Phase 5: Main UI Implementation
**Estimated Time: 90 minutes**

#### 5.1 Create Shiki Highlighter Singleton
Create `app/lib/highlighter.ts`:
```typescript
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

// Create singleton highlighter with lazy-loaded languages/themes
export const highlighterPromise = createHighlighterCore({
  themes: [
    () => import("@shikijs/themes/github-dark"),
    () => import("@shikijs/themes/github-light"),
  ],
  langs: [
    () => import("@shikijs/langs/javascript"),
    () => import("@shikijs/langs/typescript"),
    () => import("@shikijs/langs/python"),
    () => import("@shikijs/langs/java"),
    () => import("@shikijs/langs/go"),
    () => import("@shikijs/langs/bash"),
    () => import("@shikijs/langs/json"),
    () => import("@shikijs/langs/markdown"),
  ],
  engine: createJavaScriptRegexEngine(), // Smaller than WASM for client-side
});
```

#### 5.2 Create Markdown Preview Component
Create `app/components/markdown-preview.tsx`:
```typescript
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { highlighterPromise } from "../lib/highlighter";

export function MarkdownPreview({ content }: { content: string }) {
  const [rehypePlugins, setRehypePlugins] = useState<any[]>([]);
  
  useEffect(() => {
    // Load highlighter and create rehype plugin
    highlighterPromise.then((highlighter) => {
      const shikiPlugin = [
        rehypeShikiFromHighlighter,
        highlighter,
        { theme: "github-dark" },
      ];
      setRehypePlugins([shikiPlugin]);
    });
  }, []);
  
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

#### 5.3 Create Root Layout
Update `app/root.tsx`:
```typescript
import { Links, Meta, Outlet, Scripts } from "react-router";
import "./tailwind.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-[#0a0a1a] to-[#1a1a2e]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

#### 5.4 Create Main Translation Page
Create `app/routes/home.tsx`:
```typescript
import { useCompletion } from "@ai-sdk/react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { MarkdownPreview } from "../components/markdown-preview";
import { ArrowRight, Copy, Eye, Loader2 } from "lucide-react";

export default function TranslatorPage() {
  const [sourceLang, setSourceLang] = useState<"en" | "ja">("en");
  const [targetLang, setTargetLang] = useState<"en" | "ja">("ja");
  const [showPreview, setShowPreview] = useState(false);
  
  const {
    completion,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
  } = useCompletion({
    api: "/api/completion",
    body: {
      sourceLang,
      targetLang,
    },
    onStart: () => {
      setShowPreview(false);
    },
  });
  
  return (
    <div className="container mx-auto max-w-6xl p-8">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">
        Web Translator
      </h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Source Card */}
          <Card className="border-blue-500/20 bg-white/5">
            <CardHeader className="pb-3">
              <Select value={sourceLang} onValueChange={(v) => setSourceLang(v as "en" | "ja")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to translate..."
                className="min-h-[300px] bg-transparent border-0 resize-none focus-visible:ring-0"
              />
            </CardContent>
            <CardFooter>
              <span className="text-sm text-muted-foreground">
                {input.length} characters
              </span>
            </CardFooter>
          </Card>
          
          {/* Target Card */}
          <Card className="border-purple-500/20 bg-white/5">
            <CardHeader className="pb-3">
              <Select value={targetLang} onValueChange={(v) => setTargetLang(v as "en" | "ja")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="min-h-[300px] p-3">
                {showPreview && !isLoading ? (
                  <MarkdownPreview content={completion} />
                ) : (
                  <div className="whitespace-pre-wrap">{completion}</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <span className="text-sm text-muted-foreground">
                {completion.length} characters
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={isLoading || !completion}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => navigator.clipboard.writeText(completion)}
                  disabled={!completion}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        {/* Translate Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                翻訳する
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}
```

### Phase 6: Testing Setup
**Estimated Time: 30 minutes**

#### 6.1 Install Testing Dependencies
```bash
# Cloudflare Workers testing with Vitest
pnpm add -D vitest@~3.2.0 @cloudflare/vitest-pool-workers

# React testing utilities
pnpm add -D @testing-library/react @testing-library/user-event jsdom
```

#### 6.2 Create Test Configuration
Update `vitest.config.ts` (merge with existing Vite config):
```typescript
import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    reactRouter(),
  ],
  ssr: {
    target: "webworker",
    resolve: { conditions: ["workerd", "browser"] },
  },
  test: defineWorkersConfig({
    poolOptions: {
      workers: {
        main: "./workers/app.ts",
        miniflare: {
          // Test environment bindings
          kvNamespaces: ["TRANSLATION_CACHE"],
          bindings: {
            OPENAI_API_KEY: "test-key",
            CF_ACCOUNT_ID: "test-account",
            AI_GATEWAY_ID: "test-gateway",
          },
        },
      },
    },
  }),
});
```

#### 6.3 Create Basic Translation Test
Create `app/routes/home.test.tsx`:
```typescript
import { createRoutesStub } from "react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TranslatorPage from "./home";

describe("Translation Feature", () => {
  test("successful translation", async () => {
    const user = userEvent.setup();
    
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("こんにちは"));
          controller.close();
        },
      }),
    });
    
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: TranslatorPage,
      },
    ]);
    
    render(<Stub />);
    
    const textarea = screen.getByPlaceholderText("Enter text to translate...");
    await user.type(textarea, "Hello");
    
    const button = screen.getByText("翻訳する");
    await user.click(button);
    
    // Verify translation appears
    expect(await screen.findByText("こんにちは")).toBeInTheDocument();
  });
  
  test("translation error handling", async () => {
    const user = userEvent.setup();
    
    // Mock API error
    global.fetch = vi.fn().mockRejectedValueOnce(
      new Error("Translation failed")
    );
    
    const Stub = createRoutesStub([
      {
        path: "/",
        Component: TranslatorPage,
      },
    ]);
    
    render(<Stub />);
    
    const textarea = screen.getByPlaceholderText("Enter text to translate...");
    await user.type(textarea, "Hello");
    
    const button = screen.getByText("翻訳する");
    await user.click(button);
    
    // Verify error message appears
    expect(await screen.findByText(/Translation failed/i)).toBeInTheDocument();
  });
});
```

#### 6.4 Create Worker Integration Test
Create `workers/app.test.ts`:
```typescript
import { describe, test, expect, beforeAll } from "vitest";
import { env, fetchMock } from "cloudflare:test";
import worker from "./app";

describe("Worker Integration", () => {
  beforeAll(() => {
    // Mock OpenAI API responses
    fetchMock.activate();
    fetchMock.disableNetConnect();
  });

  test("handles translation API request", async () => {
    // Mock OpenAI streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"text":"こんにちは"}\n\n'));
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    fetchMock
      .get("https://gateway.ai.cloudflare.com")
      .intercept({ path: /.*/ })
      .reply(200, mockStream);

    // Test the API endpoint
    const request = new Request("http://localhost/api/completion", {
      method: "POST",
      body: JSON.stringify({
        prompt: "Hello",
        sourceLang: "en",
        targetLang: "ja",
      }),
    });

    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
    
    // Verify streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = "";
    
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      result += decoder.decode(value);
    }
    
    expect(result).toContain("こんにちは");
  });

  test("uses KV cache when available", async () => {
    // Pre-populate cache
    const cacheKey = "translate:en:ja:aGVsbG8=";
    await env.TRANSLATION_CACHE.put(cacheKey, "こんにちは (cached)");

    const request = new Request("http://localhost/api/completion", {
      method: "POST",
      body: JSON.stringify({
        prompt: "hello",
        sourceLang: "en",
        targetLang: "ja",
      }),
    });

    const response = await worker.fetch(request, env);
    const text = await response.text();
    
    expect(text).toBe("こんにちは (cached)");
  });
});
```

### Phase 7: Deployment Preparation
**Estimated Time: 20 minutes**

#### 7.1 Create KV Namespace
```bash
wrangler kv namespace create TRANSLATION_CACHE
# Note the ID and update wrangler.jsonc
```

#### 7.2 Set Secrets
```bash
wrangler secret put OPENAI_API_KEY
# Enter your OpenAI API key when prompted

wrangler secret put CF_ACCOUNT_ID
# Enter your Cloudflare account ID

wrangler secret put AI_GATEWAY_ID
# Enter your AI Gateway ID
```

#### 7.3 Configure AI Gateway
1. Log into Cloudflare Dashboard
2. Navigate to AI > AI Gateway
3. Create new gateway named "web-translator"
4. Note the gateway ID

#### 7.4 Configure Cloudflare Access
1. Log into Cloudflare Dashboard
2. Navigate to Zero Trust → Access → Applications
3. Click "Add an application" and select "Self-hosted"
4. Configure:
   - Application name: "Web Translator"
   - Application domain: `web-translator.{your-domain}.com`
   - Create policy:
     - Policy name: "Personal Access"
     - Include: Email equals `{your-email@example.com}`
5. Save the application

**Note**: This requires no code changes - Access protection is applied at the edge.

#### 7.5 Local Development
```bash
pnpm dev
# Test the application locally
```

### Phase 8: Final Polish
**Estimated Time: 15 minutes**

#### 8.1 Add Loading States
- Ensure all buttons show proper loading indicators
- Add skeleton loaders if needed

#### 8.2 Error Handling
- Test error scenarios
- Ensure graceful error messages

#### 8.3 Code Quality
```bash
pnpm lint
pnpm format
pnpm test
```

**Note**: Tests will run in the Cloudflare Workers runtime using Miniflare, ensuring your tests match production behavior.

#### 8.4 Performance Optimization
- Verify Shiki languages are lazy-loaded
- Check bundle size with `pnpm build`
- Ensure only used languages/themes are downloaded

## Implementation Order Summary

1. **Project Setup** (Phase 1) - Create project structure
2. **UI Framework** (Phase 2) - Set up shadcn/ui components
3. **Core Structure** (Phase 3) - Worker and routing setup
4. **Backend Logic** (Phase 4) - Translation service and caching
5. **Frontend UI** (Phase 5) - Main translation interface
6. **Testing** (Phase 6) - Basic test coverage
7. **Deployment** (Phase 7) - Configure for production
8. **Polish** (Phase 8) - Final touches

## Total Estimated Time: ~5 hours

## Key Considerations

### Critical Path Items
1. AI Gateway must be configured before testing translations
2. KV namespace must exist before deployment
3. Environment variables must be set correctly
4. Shiki highlighter must be cached as singleton to avoid re-initialization
5. Routes must be configured in `app/routes.ts` (not file-based)

### Potential Issues
1. **CORS**: Handled automatically by React Router
2. **Streaming**: Use AI SDK's built-in streaming support
3. **Caching**: Ensure KV keys are properly formatted
4. **Rate Limits**: AI Gateway helps with rate limit management
5. **Bundle Size**: Use Shiki's fine-grained imports to minimize client bundle
6. **Type Imports**: Use route-specific generated types (e.g., `./+types.home`)

### React Router v7 Updates
Based on official documentation:
- Routes configured in `app/routes.ts` using `route()` and `index()` functions
- Type imports are route-specific (not from `../+types.root`)
- API routes are regular routes that export action functions
- No underscore prefixes for route files
- `unstable_viteEnvironmentApi` is required for Cloudflare Workers deployment
- SSR must be enabled (`ssr: true`) when using Cloudflare Vite plugin

### Shiki.js Optimization Notes
Based on 2024 best practices:
- Using `createHighlighterCore` with dynamic imports for optimal bundle splitting
- JavaScript regex engine instead of WASM for smaller client bundle
- Singleton pattern prevents expensive re-initialization
- Each language/theme loads only when needed via lazy imports
- Rehype integration for seamless React Markdown support

### Success Criteria Checklist
- [ ] Translation works with streaming
- [ ] Caching reduces API calls
- [ ] UI matches v0 prototype design
- [ ] Loading states work correctly
- [ ] Preview mode toggles properly
- [ ] Character counts update
- [ ] Error handling is graceful
- [ ] Tests pass
- [ ] Biome linting passes