import { createOpenAI } from "@ai-sdk/openai";
import { createDataStreamResponse, formatDataStreamPart, streamText } from "ai";
import { generateCacheKey } from "../../lib/cache/hash";
import { getCached, setCached } from "../../lib/cache/redis-storage";
import type { Route } from "./+types/completion";

type CompletionRequest = {
  prompt: string;
  sourceLang: string;
  targetLang: string;
};

function errorHandler(error: unknown, context?: { sourceLang?: string; targetLang?: string; inputLength?: number }) {
  // Log the error with context for debugging
  console.error("Translation API Error:", {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  });

  // Return a user-friendly error message
  if (error == null) {
    return "An unknown error occurred during translation";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    // Check for specific error types and provide helpful messages
    if (error.message.includes("rate limit")) {
      return "Translation service is temporarily unavailable due to high demand. Please try again in a moment.";
    }
    if (error.message.includes("timeout")) {
      return "The translation request timed out. Please try with a shorter text.";
    }
    if (error.message.includes("model")) {
      return "The translation model is currently unavailable. Please try again later.";
    }

    // For other errors, return a sanitized message
    return `Translation failed: ${error.message}`;
  }

  return "An unexpected error occurred during translation";
}

export async function action({ request }: Route.ActionArgs) {
  const { prompt, sourceLang, targetLang } = (await request.json()) as CompletionRequest;

  // Context for error handling
  const errorContext = {
    sourceLang,
    targetLang,
    inputLength: prompt?.length || 0,
  };

  // Check cache
  const cacheKey = await generateCacheKey(prompt, sourceLang, targetLang);
  const cached = await getCached(cacheKey);

  if (cached) {
    // Return cached content as a proper data stream response
    return createDataStreamResponse({
      execute(stream) {
        // Format the cached text as a proper data stream part
        stream.write(formatDataStreamPart("text", cached));
      },
      onError: (error) => errorHandler(error, errorContext),
    });
  }

  // Create AI client directly with OpenAI
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Stream translation
  const result = streamText({
    model: openai.responses("gpt-4.1-nano"),
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following text from ${sourceLang} to ${targetLang}.

                 FORMATTING IMPROVEMENTS (You SHOULD do these):
                 1. Wrap obvious code snippets in proper code blocks (\`\`\`) if they aren't already
                 2. Add language identifiers to code blocks when missing (e.g., \`\`\`ts, \`\`\`python, \`\`\`bash)
                 3. Fix inconsistent markdown formatting for better readability
                 4. Preserve the improved formatting in your translation

                 CODE PRESERVATION (You MUST follow these):
                 1. DO NOT translate ANY content inside code blocks
                 2. DO NOT translate code syntax, variable names, function names, or technical identifiers
                 3. DO NOT translate Mermaid diagrams (keep \`\`\`mermaid blocks exactly as-is)
                 4. Keep all technical terms and commands in their original language

                 LANGUAGE DETECTION HINTS:
                 - TypeScript/JavaScript: const, let, var, =>, function, import, export
                 - Python: def, class, import, from, if __name__
                 - Shell/Bash: $, commands like cd, ls, git, npm, pnpm
                 - SQL: SELECT, FROM, WHERE, INSERT, UPDATE
                 - YAML: key: value patterns with consistent indentation
                 - JSON: { }, [ ], "key": "value"
                 
                 CONTEXT-BASED DETECTION:
                 Also use surrounding sentences to infer the language:
                 - "React component", "Next.js", "Vue" → JavaScript/TypeScript
                 - "Django", "Flask", "pip install" → Python
                 - "terminal", "command line", "bash script" → Shell/Bash
                 - "database query", "table", "schema" → SQL
                 - "configuration file", "settings" → YAML/JSON
                 - "Dockerfile", "container" → Dockerfile syntax

                 EXAMPLES:
                 - If you see: Run npm install to install dependencies
                   Improve to: Run \`npm install\` to install dependencies

                 - If you see unformatted code like:
                   const greeting = "Hello"
                   console.log(greeting)
                   
                   Wrap it as:
                   \`\`\`js
                   const greeting = "Hello"
                   console.log(greeting)
                   \`\`\`

                 - If context mentions "React component" and you see:
                   function Button({ label }) {
                     return <button>{label}</button>
                   }
                   
                   Wrap it as:
                   \`\`\`tsx
                   function Button({ label }) {
                     return <button>{label}</button>
                   }
                   \`\`\`

                 Translate natural language text while improving technical documentation formatting.
                 Provide only the translation without any explanations.`,
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    maxTokens: 4096,
    onFinish: async ({ text }) => {
      await setCached(cacheKey, text, 604800); // 7 days
    },
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => errorHandler(error, errorContext),
  });
}
