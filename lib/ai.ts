import { createAzure } from "@ai-sdk/azure";

const azure = createAzure({
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT ?? ""}/openai`,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: "preview",
});

export function getModel() {
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-5-mini";
  return azure.responses(deployment);
}

export const AGENT_PROVIDER_OPTIONS = {
  openai: {
    reasoningEffort: "low",
    store: false,
  },
} as const;
