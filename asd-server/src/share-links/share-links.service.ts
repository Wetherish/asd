import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { Artifact } from '../shared/contract';
import { toArtifact } from '../shared/mappers';
import { hashPassword, verifyPassword } from './password';

export type ShareLinkResponse = { id: string; token: string; url: string };

// Password-protected share links on artifacts. The `GET /share/:token` routes are
// `@Public()` — the only unauthenticated read path in the app, gated by the
// unguessable token and (optionally) a password.
@Injectable()
export class ShareLinksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SessionAccessService,
    private readonly jwt: JwtService,
  ) {}

  async create(
    artifactId: string,
    input: { password?: string; expiresAt?: string },
    userId: string,
  ): Promise<ShareLinkResponse> {
    await this.loadArtifactForWrite(artifactId, userId);
    const token = randomBytes(32).toString('base64url');
    const link = await this.prisma.shareLink.create({
      data: {
        artifactId,
        token,
        passwordHash: input.password ? hashPassword(input.password) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return { id: link.id, token: link.token, url: `/share/${link.token}` };
  }

  async revoke(artifactId: string, linkId: string, userId: string): Promise<void> {
    await this.loadArtifactForWrite(artifactId, userId);
    await this.prisma.shareLink.updateMany({ where: { id: linkId, artifactId }, data: { revoked: true } });
  }

  // Public: resolve a link to a read-only artifact, or signal that a password is
  // required. `key` is the short-lived unlock token from `unlock`.
  async getByToken(token: string, key?: string): Promise<{ needsPassword: boolean; artifact?: Artifact }> {
    const link = await this.loadLink(token);
    if (link.passwordHash && !(key && this.verifyKey(key, token))) {
      return { needsPassword: true };
    }
    const artifact = await this.prisma.artifact.findUnique({
      where: { id: link.artifactId },
      include: { shares: { include: { user: true } } },
    });
    if (!artifact) throw new NotFoundException('Artifact not found');
    return { needsPassword: false, artifact: toArtifact(artifact) };
  }

  async unlock(token: string, password: string): Promise<{ key: string }> {
    const link = await this.loadLink(token);
    if (!link.passwordHash) throw new BadRequestException('This link is not password-protected');
    if (!verifyPassword(password, link.passwordHash)) throw new UnauthorizedException('Incorrect password');
    const key = await this.jwt.signAsync({ sub: token, scope: 'share' }, { expiresIn: '15m' });
    return { key };
  }

  private async loadArtifactForWrite(id: string, userId: string): Promise<void> {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id },
      select: { sessionId: true },
    });
    if (!artifact) throw new NotFoundException('Artifact not found');
    await this.access.requireEditor(artifact.sessionId, userId);
  }

  private async loadLink(token: string): Promise<{
    artifactId: string;
    passwordHash: string | null;
    expiresAt: Date | null;
    revoked: boolean;
  }> {
    const link = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!link || link.revoked) throw new NotFoundException('Link not found');
    if (link.expiresAt && link.expiresAt.getTime() < Date.now()) throw new NotFoundException('Link expired');
    return link;
  }

  private verifyKey(key: string, token: string): boolean {
    try {
      const payload = this.jwt.verify(key) as { sub?: string; scope?: string };
      return payload.sub === token && payload.scope === 'share';
    } catch {
      return false;
    }
  }
}
