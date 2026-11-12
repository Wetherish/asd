import { IsIn, IsOptional, IsString } from "class-validator";

export const LLM_PROVIDERS = ["openai", "anthropic", "deepseek", "openrouter", "openai-compatible"] as const;

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(LLM_PROVIDERS)
  provider?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  baseUrl?: string;
}
