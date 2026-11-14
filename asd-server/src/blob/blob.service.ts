import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export type StoredBlob = { blobKey: string; url: string; mime: string };

const MIME_BY_EXT: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.html': 'text/html',
};

const EXT_BY_MIME: Record<string, string> = {
  'image/svg+xml': '.svg',
  'image/png': '.png',
  'text/csv': '.csv',
  'application/json': '.json',
  'text/plain': '.txt',
  'text/html': '.html',
};

// Blob storage for file-like artifact content (image/data/app). The local
// implementation writes to disk and serves via `GET /files/:blobKey` with an
// unguessable key (a capability URL, like the share links). In production this
// is S3 + presigned URLs behind the same interface (see design/05-tools.md §3).
@Injectable()
export class BlobService {
  private readonly dir: string;

  constructor(config: ConfigService) {
    this.dir = config.get<string>('BLOB_DIR') ?? join(process.cwd(), 'storage', 'blobs');
  }

  async put(content: string | Buffer, mime: string, name: string): Promise<StoredBlob> {
    const ext = EXT_BY_MIME[mime] ?? extFromName(name) ?? '.bin';
    const blobKey = `${randomUUID()}${ext}`;
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(join(this.dir, blobKey), content);
    return { blobKey, url: `/files/${blobKey}`, mime };
  }

  async get(blobKey: string): Promise<{ content: Buffer; mime: string }> {
    const safe = blobKey.replace(/[^a-zA-Z0-9._-]/g, '');
    const content = await fs.readFile(join(this.dir, safe));
    return { content, mime: MIME_BY_EXT[extFromName(safe)] ?? 'application/octet-stream' };
  }
}

function extFromName(name: string): string {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i).toLowerCase() : '';
}
