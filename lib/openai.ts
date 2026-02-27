import OpenAI from "openai";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "arcee-ai/trinity-large-preview:free";

export function getOpenAIClient() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL ?? OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
      "X-Title": "open-chat",
    },
  });
}

export function getLLMModel() {
  return process.env.OPENAI_MODEL ?? DEFAULT_MODEL;
}
