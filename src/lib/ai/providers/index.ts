import { AnthropicProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { MockAIProvider } from "./mock";
import { OpenAIProvider } from "./openai";
import type { AIProvider } from "./types";

export type AIProviderName = "openai" | "anthropic" | "gemini" | "mock";

export function getAIProvider(
  preferred?: AIProviderName | string | null,
): AIProvider {
  const name = (preferred || process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (name) {
    case "openai":
      return process.env.OPENAI_API_KEY ? new OpenAIProvider() : new MockAIProvider();
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY
        ? new AnthropicProvider()
        : new MockAIProvider();
    case "gemini":
      return process.env.GEMINI_API_KEY
        ? new GeminiProvider()
        : new MockAIProvider();
    default:
      return new MockAIProvider();
  }
}

export * from "./types";
