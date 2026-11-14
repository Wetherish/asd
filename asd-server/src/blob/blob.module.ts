import { Global, Module } from '@nestjs/common';
import { BlobController } from './blob.controller';
import { BlobService } from './blob.service';

@Global()
@Module({
  controllers: [BlobController],
  providers: [BlobService],
  exports: [BlobService],
})
export class BlobModule {}
