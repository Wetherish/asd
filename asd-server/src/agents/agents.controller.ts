import { Controller, Get, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Agent } from '../shared/contract';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Get()
  list(): Promise<Agent[]> {
    return this.agents.list();
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Agent> {
    return this.agents.get(id);
  }
}
