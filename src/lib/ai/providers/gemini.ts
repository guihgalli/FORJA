import type { AICompletionRequest, AICompletionResult, AIProvider } from "./types";

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  constructor(private apiKey = process.env.GEMINI_API_KEY) {}

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY não configurada");
    }

    const started = Date.now();
    const model =
      request.model ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const prompt = request.messages
      .map((m) => `${m.role.toUpperCase()}:\n${m.content}`)
      .join("\n\n");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.4,
          maxOutputTokens: request.maxTokens ?? 2500,
          responseMimeType:
            request.responseFormat === "json" ? "application/json" : "text/plain",
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini error ${res.status}: ${text}`);
    }

    const data = await res.json();
    const content =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") ?? "";

    return {
      content,
      model,
      inputTokens: data.usageMetadata?.promptTokenCount,
      outputTokens: data.usageMetadata?.candidatesTokenCount,
      latencyMs: Date.now() - started,
      provider: this.name,
    };
  }
}
