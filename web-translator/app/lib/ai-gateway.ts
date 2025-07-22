import { createOpenAI } from "@ai-sdk/openai";

export function createAIGateway(env: Env) {
  return createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.AI_GATEWAY_ID}/openai`,
  });
}
