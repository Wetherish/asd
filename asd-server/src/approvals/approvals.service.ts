import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SessionAccessService } from '../common/session-access.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Approval } from '../shared/contract';
import { toApproval } from '../shared/mappers';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly access: SessionAccessService,
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

    const dto = toApproval(updated);
    this.realtime.publish({ type: 'approval.updated', data: { approval: dto } });
    return dto;
  }
}
