export type AIChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AICompletionRequest = {
  messages: AIChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "json" | "text";
};

export type AICompletionResult = {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  provider: string;
};

export interface AIProvider {
  readonly name: string;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
}
