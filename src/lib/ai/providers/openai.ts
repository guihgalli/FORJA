import type { AICompletionRequest, AICompletionResult, AIProvider } from "./types";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(
    private apiKey = process.env.OPENAI_API_KEY,
    private baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  ) {}

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY não configurada");
    }

    const started = Date.now();
    const model = request.model ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: request.temperature ?? 0.4,
        max_tokens: request.maxTokens ?? 2500,
        messages: request.messages,
        response_format:
          request.responseFormat === "json"
            ? { type: "json_object" }
            : undefined,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content ?? "",
      model,
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
      latencyMs: Date.now() - started,
      provider: this.name,
    };
  }
}
