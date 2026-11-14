import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { Artifact, PersonRole } from '../shared/contract';
import { toArtifact } from '../shared/mappers';

@Injectable()
export class ArtifactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SessionAccessService,
  ) {}

  async listBySession(sessionId: string, userId: string): Promise<Artifact[]> {
    await this.access.requireMember(sessionId, userId);
    const artifacts = await this.prisma.artifact.findMany({
      where: { sessionId },
      include: { shares: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return artifacts.map((a) => toArtifact(a));
  }

  async get(id: string, userId: string): Promise<Artifact> {
    const artifact = await this.loadFor(id, userId, false);
    return toArtifact(artifact);
  }

  async create(
    sessionId: string,
    input: { kind: string; name: string; content?: unknown },
    authorId: string,
  ): Promise<Artifact> {
    await this.access.requireEditor(sessionId, authorId);
    const artifact = await this.prisma.artifact.create({
      data: {
        sessionId,
        kind: input.kind,
        name: input.name,
        authorId,
        content: JSON.stringify(input.content ?? this.defaultContent(input.kind)),
      },
      include: { shares: { include: { user: true } } },
    });
    return toArtifact(artifact);
  }

  async update(id: string, patch: { name?: string; content?: unknown }, userId: string): Promise<Artifact> {
    await this.loadFor(id, userId, true);
    const data: { name?: string; content?: string } = {};
    if (patch.name !== undefined) data.name = patch.name;
    if (patch.content !== undefined) data.content = JSON.stringify(patch.content);

    const artifact = await this.prisma.artifact.update({
      where: { id },
      data,
      include: { shares: { include: { user: true } } },
    });
    return toArtifact(artifact);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.loadFor(id, userId, true);
    await this.prisma.artifact.delete({ where: { id } });
  }

  async share(id: string, personIds: string[], role: PersonRole, userId: string): Promise<Artifact> {
    await this.loadFor(id, userId, true);
    await this.prisma.artifact.update({
      where: { id },
      data: {
        shares: { create: personIds.map((userId) => ({ userId, role })) },
      },
    });
    return this.get(id, userId);
  }

  // Loads an artifact and enforces access (write = owner/editor). Throws 404 for
  // missing artifacts and non-members alike.
  private async loadFor(id: string, userId: string, write: boolean): Promise<{ sessionId: string }> {
    const artifact = await this.prisma.artifact.findUnique({
      where: { id },
      include: { shares: { include: { user: true } } },
    });
    if (!artifact) throw new NotFoundException('Artifact not found');
    if (write) await this.access.requireEditor(artifact.sessionId, userId);
    else await this.access.requireMember(artifact.sessionId, userId);
    return artifact;
  }

  private defaultContent(kind: string): unknown {
    switch (kind) {
      case 'table':
        return { kind: 'table', columns: [], rows: [] };
      case 'doc':
        return { kind: 'doc', body: '' };
      case 'canvas':
        return { kind: 'canvas', nodes: [] };
      case 'list':
        return { kind: 'list', items: [] };
      case 'data':
        return { kind: 'data', format: 'csv', blobKey: '', preview: { columns: [], rows: [] } };
      default:
        return { kind: 'dashboard', widgets: [] };
    }
  }
}
