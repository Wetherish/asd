import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Session } from '../shared/contract';
import { toSession } from '../shared/mappers';
import { CreateSessionDto } from './dto';

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly access: SessionAccessService,
  ) {}

  async list(userId: string): Promise<Session[]> {
    const sessions = await this.prisma.session.findMany({
      where: { archived: false, members: { some: { userId } } },
      include: { members: { include: { user: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return sessions.map((s) => toSession(s));
  }

  async get(id: string, userId: string): Promise<Session> {
    await this.access.requireMember(id, userId);
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    return toSession(session);
  }

  async create(input: CreateSessionDto, userId: string): Promise<Session> {
    const agent = await this.prisma.agent.findUnique({ where: { id: input.leadAgentId } });
    if (!agent) throw new NotFoundException('Lead agent not found');

    const memberIds = Array.from(new Set([userId, ...(input.memberIds ?? [])]));
    const session = await this.prisma.session.create({
      data: {
        id: randomUUID(),
        title: input.title,
        leadAgentId: input.leadAgentId,
        members: {
          create: memberIds.map((uid) => ({ userId: uid, role: uid === userId ? 'owner' : 'editor' })),
        },
      },
      include: { members: { include: { user: true } } },
    });
    return toSession(session);
  }

  async update(id: string, patch: { title?: string }, userId: string): Promise<Session> {
    await this.access.requireEditor(id, userId);
    const session = await this.prisma.session.update({
      where: { id },
      data: patch.title ? { title: patch.title } : {},
      include: { members: { include: { user: true } } },
    });
    const dto = toSession(session);
    this.realtime.publish({ type: 'session.updated', data: { session: dto } });
    return dto;
  }

  async archive(id: string, userId: string): Promise<void> {
    await this.access.requireEditor(id, userId);
    await this.prisma.session.update({ where: { id }, data: { archived: true } });
  }
}
