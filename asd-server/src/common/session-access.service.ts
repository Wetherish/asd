import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonRole } from '../shared/contract';

// Central authorization helper for session-scoped resources. Every session
// endpoint must resolve the caller's role before reading or writing so that
// sessions are only visible/editable to their members (writes: owner/editor).
@Injectable()
export class SessionAccessService {
  constructor(private readonly prisma: PrismaService) {}

  // The caller's membership role, or undefined when not a member.
  async role(sessionId: string, userId: string): Promise<PersonRole | undefined> {
    const member = await this.prisma.sessionMember.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    return (member?.role as PersonRole) ?? undefined;
  }

  // Every session id the user is a member of (for realtime filtering).
  async memberSessionIds(userId: string): Promise<string[]> {
    const memberships = await this.prisma.sessionMember.findMany({
      where: { userId },
      select: { sessionId: true },
    });
    return memberships.map((m) => m.sessionId);
  }

  // Read access — caller must be a member. Throws 404 (not 403) so non-members
  // cannot distinguish "missing" from "exists but I can't see it".
  async requireMember(sessionId: string, userId: string): Promise<PersonRole> {
    const role = await this.role(sessionId, userId);
    if (!role) throw new NotFoundException('Session not found');
    return role;
  }

  // Write access — caller must be a member AND owner/editor.
  async requireEditor(sessionId: string, userId: string): Promise<PersonRole> {
    const role = await this.requireMember(sessionId, userId);
    if (role !== 'owner' && role !== 'editor') {
      throw new ForbiddenException('Only owners and editors can modify this session');
    }
    return role;
  }
}
