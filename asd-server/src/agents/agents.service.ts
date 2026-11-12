import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Agent } from '../shared/contract';
import { toAgent } from '../shared/mappers';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<Agent[]> {
    const agents = await this.prisma.agent.findMany({ include: { connections: true }, orderBy: { name: 'asc' } });
    return agents.map((a) => toAgent(a));
  }

  async get(id: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({ where: { id }, include: { connections: true } });
    if (!agent) throw new NotFoundException('Agent not found');
    return toAgent(agent);
  }
}
