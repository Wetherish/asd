import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SessionAccessService } from '../common/session-access.service';
import { EngineService } from '../engine/engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Approval } from '../shared/contract';
import { toApproval } from '../shared/mappers';

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly access: SessionAccessService,
    private readonly engine: EngineService,
  ) {}

  async list(status: string | undefined, userId: string): Promise<Approval[]> {
    const memberships = await this.prisma.sessionMember.findMany({
      where: { userId },
      select: { sessionId: true },
    });
    const sessionIds = memberships.map((m) => m.sessionId);
    const approvals = await this.prisma.approval.findMany({
      where: { sessionId: { in: sessionIds }, ...(status ? { status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return approvals.map((a) => toApproval(a));
  }

  async decide(id: string, action: string, userId: string): Promise<Approval> {
    const approval = await this.prisma.approval.findUnique({ where: { id } });
    if (!approval) throw new NotFoundException('Approval not found');
    await this.access.requireEditor(approval.sessionId, userId);
    if (approval.status !== 'pending') throw new BadRequestException('Approval already decided');

    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'edited';
    const updated = await this.prisma.approval.update({
      where: { id },
      data: { status, decidedBy: userId, decidedAt: new Date() },
    });

    // Resume an approval-gated tool once it is approved.
    if (status === 'approved' && updated.pendingTool) {
      await this.runDeferredTool(updated);
    }

    const dto = toApproval(updated);
    this.realtime.publish({ type: 'approval.updated', data: { approval: dto } });
    return dto;
  }

  private async runDeferredTool(approval: { sessionId: string; messageId: string; pendingTool: string | null }): Promise<void> {
    if (!approval.pendingTool) return;
    try {
      const { toolId, args } = JSON.parse(approval.pendingTool) as { toolId: string; args: unknown };
      const message = await this.prisma.message.findUnique({ where: { id: approval.messageId } });
      if (message) {
        await this.engine.executeTool(approval.sessionId, message.authorId, approval.messageId, toolId, args);
      }
    } catch (err) {
      this.logger.error(`deferred tool failed for message ${approval.messageId}`, err as Error);
    }
  }
}
