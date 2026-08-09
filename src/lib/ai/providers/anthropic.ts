import type { AICompletionRequest, AICompletionResult, AIProvider } from "./types";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  constructor(private apiKey = process.env.ANTHROPIC_API_KEY) {}

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new Error("ANTHROPIC_API_KEY não configurada");
    }

    const started = Date.now();
    const model =
      request.model ?? process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest";
    const system = request.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");
    const messages = request.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens ?? 2500,
        temperature: request.temperature ?? 0.4,
        system,
        messages,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content =
      data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";

    return {
      content,
      model,
      inputTokens: data.usage?.input_tokens,
      outputTokens: data.usage?.output_tokens,
      latencyMs: Date.now() - started,
      provider: this.name,
    };
  }
}
