import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LLMConfig, defaultModel } from "../llm/providers";
import { KmsService } from "../kms/kms.service";

// What the client is allowed to see (API key is never returned).
export type SettingsView = {
  provider: string;
  model: string;
  baseUrl: string;
  apiKeySet: boolean;
};

// Per-user LLM settings. Provider/model/baseUrl are stored on the User row
// (non-sensitive); the API key is stored as KMS ciphertext and only decrypted
// when that user's agent runs.
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kms: KmsService,
  ) {}

  async getLLMConfig(userId: string): Promise<LLMConfig> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const provider = user.llmProvider ?? "openai";
    const model = user.llmModel ?? defaultModel(provider);
    const baseUrl = user.llmBaseUrl ?? "";
    const apiKey = user.llmApiKeyEncrypted ? await this.kms.decrypt(user.llmApiKeyEncrypted) : "";
    return { provider, apiKey, model, baseUrl: baseUrl || undefined };
  }

  async getView(userId: string): Promise<SettingsView> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const provider = user.llmProvider ?? "openai";
    return {
      provider,
      model: user.llmModel ?? defaultModel(provider),
      baseUrl: user.llmBaseUrl ?? "",
      apiKeySet: !!user.llmApiKeyEncrypted,
    };
  }

  async update(
    userId: string,
    input: { provider?: string; model?: string; apiKey?: string; baseUrl?: string },
  ): Promise<void> {
    const data: {
      llmProvider?: string;
      llmModel?: string;
      llmBaseUrl?: string;
      llmApiKeyEncrypted?: string;
    } = {};
    if (input.provider !== undefined) data.llmProvider = input.provider;
    if (input.model !== undefined) data.llmModel = input.model;
    if (input.baseUrl !== undefined) data.llmBaseUrl = input.baseUrl;
    if (input.apiKey && input.apiKey.trim() !== "") {
      data.llmApiKeyEncrypted = await this.kms.encrypt(input.apiKey.trim());
    }
    await this.prisma.user.update({ where: { id: userId }, data });
  }
}
