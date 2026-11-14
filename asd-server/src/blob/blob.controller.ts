import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../common/public.decorator';
import { BlobService } from './blob.service';

// Serves stored blobs. `@Public()` because the unguessable `blobKey` is the
// credential (a capability URL), and the URL only reaches authorized viewers via
// the artifact content that references it.
@Controller()
export class BlobController {
  constructor(private readonly blobs: BlobService) {}

  @Public()
  @Get('files/:blobKey')
  async get(@Param('blobKey') blobKey: string, @Res() res: Response): Promise<void> {
    const result = await this.blobs.get(blobKey).catch(() => null);
    if (!result) {
      res.status(404).json({ error: { code: 'not_found', message: 'File not found' } });
      return;
    }
    res.setHeader('Content-Type', result.mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(result.content);
  }
}
