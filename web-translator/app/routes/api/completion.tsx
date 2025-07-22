import { streamText, createDataStreamResponse, formatDataStreamPart } from "ai";
import { createAIGateway } from "../../lib/ai-gateway";
import { generateCacheKey } from "../../lib/cache";
import type { Route } from "./+types/completion";

type CompletionRequest = {
  prompt: string;
  sourceLang: string;
  targetLang: string;
};

export async function action({ request, context }: Route.ActionArgs) {
  const { prompt, sourceLang, targetLang } = await request.json<CompletionRequest>();
  const env = context.cloudflare.env;

  // Check cache
  const cacheKey = await generateCacheKey(prompt, sourceLang, targetLang);
  const cached = await env.TRANSLATION_CACHE.get(cacheKey);

  if (cached) {
    // Return cached content as a proper data stream response
    return createDataStreamResponse({
      execute(stream) {
        // Format the cached text as a proper data stream part
        stream.write(formatDataStreamPart("text", cached));
      },
    });
  }

  // Create AI client
  const openai = createAIGateway(env);

  // Stream translation
  const result = streamText({
    model: openai.responses("gpt-4.1-nano"),
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
