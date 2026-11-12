import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { SettingsService, SettingsView } from "./settings.service";
import { LLMService } from "../llm/llm.service";
import { UpdateSettingsDto } from "./dto";

@Controller("settings")
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly llm: LLMService,
  ) {}

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<SettingsView> {
    return this.settings.getView(user.sub);
  }

  @Patch()
  async update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto): Promise<SettingsView> {
    await this.settings.update(user.sub, dto);
    return this.settings.getView(user.sub);
  }

  @Post("test")
  test(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto): Promise<{ ok: boolean; message: string }> {
    return this.llm.test(user.sub, dto);
  }
}
