import { Global, Module } from '@nestjs/common';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService, SessionAccessService],
  exports: [PrismaService, SessionAccessService],
})
export class PrismaModule {}
