// Provider-agnostic LLM adapters. Each provider implements `complete` against
// its native HTTP API; the engine only depends on the `LLMProvider` interface.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export interface LLMProvider {
  complete(messages: ChatMessage[], options?: { json?: boolean }): Promise<string>;
}

export type LLMConfig = {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
};

class OpenAIProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
    private readonly jsonMode = true,
  ) {}

  async complete(messages: ChatMessage[], options?: { json?: boolean }): Promise<string> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body: Record<string, unknown> = { model: this.model, messages, temperature: 0.4 };
    if (options?.json && this.jsonMode) body.response_format = { type: "json_object" };

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? "";
  }
}

class AnthropicProvider implements LLMProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  async complete(messages: ChatMessage[]): Promise<string> {
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");
    const rest = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        system: system || undefined,
        messages: rest,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    return (data.content ?? [])
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("");
  }
}

export function defaultModel(provider: string): string {
  switch (provider) {
    case "anthropic":
      return "claude-3-5-sonnet-20241022";
    case "deepseek":
      return "deepseek-chat";
    case "openrouter":
      return "deepseek/deepseek-chat";
    default:
      return "gpt-4o-mini";
  }
}

export function createLLMProvider(config: LLMConfig): LLMProvider | null {
  if (!config.apiKey) return null;
  switch (config.provider) {
    case "anthropic":
      return new AnthropicProvider(config.apiKey, config.model, config.baseUrl ?? "https://api.anthropic.com");
    case "deepseek":
      // DeepSeek exposes an OpenAI-compatible endpoint.
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl ?? "https://api.deepseek.com");
    case "openrouter":
      // OpenRouter is OpenAI-compatible. JSON mode is model-dependent, so we rely
      // on the prompt + robust parsing rather than `response_format`.
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl ?? "https://openrouter.ai/api/v1", false);
    case "openai-compatible":
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl ?? "http://localhost:11434/v1", false);
    case "openai":
    default:
      return new OpenAIProvider(config.apiKey, config.model, config.baseUrl ?? "https://api.openai.com/v1");
  }
}
