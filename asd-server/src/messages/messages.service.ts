import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { EngineService } from '../engine/engine.service';
import { Message } from '../shared/contract';
import { toMessage } from '../shared/mappers';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: EngineService,
    private readonly access: SessionAccessService,
  ) {}

  async list(sessionId: string, userId: string): Promise<Message[]> {
    await this.access.requireMember(sessionId, userId);
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      include: { trace: true, approval: true },
      orderBy: { createdAt: 'asc' },
    });
    return messages.map((m) => toMessage(m));
  }

  async send(sessionId: string, userId: string, body: string): Promise<Message> {
    const session = await this.ensureWritableSession(sessionId, userId);

    await this.prisma.message.create({
      data: { sessionId, role: 'user', authorId: userId, body, status: 'complete' },
    });

    const agentMessage = await this.prisma.message.create({
      data: { sessionId, role: 'agent', authorId: session.leadAgentId, body: '', status: 'streaming' },
    });

    // Stream + finalize in the background; the response returns the streaming message.
    void this.engine.run(session, agentMessage, body, userId).catch((err: unknown) => {
      void err; // failures surface as message.error events from the engine
    });

    return toMessage(agentMessage);
  }

  private async ensureWritableSession(
    sessionId: string,
    userId: string,
  ): Promise<{ id: string; leadAgentId: string }> {
    await this.access.requireEditor(sessionId, userId);
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.archived) throw new NotFoundException('Session not found');
    return session;
  }
}
