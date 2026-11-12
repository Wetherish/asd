import { Injectable } from "@nestjs/common";
import { SettingsService } from "../settings/settings.service";
import { ChatMessage, LLMProvider, createLLMProvider } from "./providers";

// Reads the effective per-user config from SettingsService and caches the
// provider, rebuilding it when the config changes — so Settings changes apply
// without a restart.
@Injectable()
export class LLMService {
  private cached: { key: string; provider: LLMProvider | null } | null = null;

  constructor(private readonly settings: SettingsService) {}

  async enabled(userId: string): Promise<boolean> {
    return (await this.provider(userId)) !== null;
  }

  async complete(userId: string, messages: ChatMessage[], options?: { json?: boolean }): Promise<string> {
    const provider = await this.provider(userId);
    if (!provider) throw new Error("LLM is not configured");
    return provider.complete(messages, options);
  }

  // Makes a minimal real call to verify the key/model/endpoint. `input` values
  // (when provided) override the saved config for the test, without persisting.
  async test(
    userId: string,
    input: { provider?: string; model?: string; apiKey?: string; baseUrl?: string },
  ): Promise<{ ok: boolean; message: string }> {
    const current = await this.settings.getLLMConfig(userId);
    const apiKey = input.apiKey && input.apiKey.trim() !== "" ? input.apiKey.trim() : current.apiKey;
    const provider = createLLMProvider({
      provider: input.provider ?? current.provider,
      apiKey,
      model: input.model ?? current.model,
      baseUrl: input.baseUrl ?? current.baseUrl,
    });
    if (!provider) return { ok: false, message: "No API key configured" };
    try {
      const reply = await provider.complete([{ role: "user", content: "Reply with exactly the word: ok" }]);
      const trimmed = reply.trim().slice(0, 200);
      return { ok: true, message: trimmed || "Connected" };
    } catch (err) {
      const message = (err instanceof Error ? err.message : String(err)).slice(0, 200);
      return { ok: false, message };
    }
  }

  private async provider(userId: string): Promise<LLMProvider | null> {
    const cfg = await this.settings.getLLMConfig(userId);
    const key = `${userId}:${JSON.stringify(cfg)}`;
    if (!this.cached || this.cached.key !== key) {
      this.cached = { key, provider: createLLMProvider(cfg) };
    }
    return this.cached.provider;
  }
}
