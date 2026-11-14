import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';
import { LLMModule } from './llm/llm.module';
import { SettingsModule } from './settings/settings.module';
import { EngineModule } from './engine/engine.module';
import { AuthModule } from './auth/auth.module';
import { AgentsModule } from './agents/agents.module';
import { SessionsModule } from './sessions/sessions.module';
import { MessagesModule } from './messages/messages.module';
import { ApprovalsModule } from './approvals/approvals.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { ShareLinksModule } from './share-links/share-links.module';
import { ToolsModule } from './tools/tools.module';
import { SandboxModule } from './sandbox/sandbox.module';
import { BlobModule } from './blob/blob.module';
import { JobsModule } from './jobs/jobs.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    PrismaModule,
    RealtimeModule,
    LLMModule,
    SettingsModule,
    EngineModule,
    AuthModule,
    AgentsModule,
    SessionsModule,
    MessagesModule,
    ApprovalsModule,
    ArtifactsModule,
    ShareLinksModule,
    ToolsModule,
    SandboxModule,
    BlobModule,
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
