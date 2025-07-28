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
                 
                 CRITICAL RULES:
                 1. Preserve ALL markdown formatting exactly as it appears
                 2. DO NOT translate ANY content inside code blocks (text between \`\`\` markers)
                 3. Specifically, DO NOT translate Mermaid diagrams (code blocks marked with \`\`\`mermaid)
                 4. Keep all code syntax, variable names, and technical identifiers unchanged
                 5. Preserve all special characters, line breaks, and spacing exactly
                 
                 Translate ONLY the natural language text outside of code blocks.
                 Provide only the translation without any explanations or notes.`,
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
