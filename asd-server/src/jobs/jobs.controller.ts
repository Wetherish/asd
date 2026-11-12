import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Job, LogEntry } from '../shared/contract';
import { CreateJobDto } from './dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  list(): Promise<Job[]> {
    return this.jobs.list();
  }

  @Post()
  create(@Body() dto: CreateJobDto): Promise<Job> {
    return this.jobs.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<Job> {
    return this.jobs.get(id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string): Promise<Job> {
    return this.jobs.pause(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string): Promise<Job> {
    return this.jobs.cancel(id);
  }

  @Get(':id/logs')
  logs(@Param('id') id: string): Promise<LogEntry[]> {
    return this.jobs.logs(id);
  }
}
