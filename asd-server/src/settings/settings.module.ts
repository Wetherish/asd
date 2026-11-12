import { Global, Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";
import { KmsService } from "../kms/kms.service";

@Global()
@Module({
  controllers: [SettingsController],
  providers: [SettingsService, KmsService],
  exports: [SettingsService],
})
export class SettingsModule {}
