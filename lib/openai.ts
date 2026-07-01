import { AzureOpenAI } from "openai";

const DEFAULT_API_VERSION = "2025-04-01-preview";
const DEFAULT_DEPLOYMENT = "gpt-5-mini";

export function getOpenAIClient() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;

  if (!apiKey) {
    throw new Error("Azure OpenAI API key not configured");
  }
  if (!endpoint) {
    throw new Error("Azure OpenAI endpoint not configured");
  }

  return new AzureOpenAI({
    apiKey,
    endpoint,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION ?? DEFAULT_API_VERSION,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT ?? DEFAULT_DEPLOYMENT,
  });
}

export function getLLMModel() {
  return process.env.AZURE_OPENAI_DEPLOYMENT ?? DEFAULT_DEPLOYMENT;
}
