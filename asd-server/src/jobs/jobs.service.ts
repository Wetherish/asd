import { Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { Job, LogEntry } from '../shared/contract';
import { toJob, toLogEntry } from '../shared/mappers';
import { CreateJobDto } from './dto';

const TICK_MS = 1200;

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  onModuleInit(): void {
    // In-process scheduler — placeholder for SQS/Step Functions in AWS.
    this.timer = setInterval(() => void this.tick(), TICK_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async list(): Promise<Job[]> {
    const jobs = await this.prisma.job.findMany({
      include: { steps: true, logs: { orderBy: { ts: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map((j) => toJob(j));
  }

  async get(id: string): Promise<Job> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { steps: true, logs: { orderBy: { ts: 'asc' } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    return toJob(job);
  }

  async create(input: CreateJobDto): Promise<Job> {
    const agent = await this.prisma.agent.findUnique({ where: { id: input.agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    const steps = this.stepsFor(input.title);
    const status = input.scheduledFor ? 'scheduled' : 'running';
    const job = await this.prisma.job.create({
      data: {
        id: randomUUID(),
        title: input.title,
        agentId: input.agentId,
        status,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        recurring: input.recurring?.rule ?? null,
        steps: { create: steps.map((title) => ({ title, status: 'queued' })) },
        logs: { create: [{ level: 'info', text: status === 'scheduled' ? 'Scheduled' : 'Started' }] },
      },
      include: { steps: true, logs: true },
    });

    const dto = toJob(job);
    this.realtime.publish({ type: 'job.updated', data: { job: dto } });
    return dto;
  }

  async pause(id: string): Promise<Job> {
    await this.ensureExists(id);
    await this.prisma.job.update({ where: { id }, data: { status: 'paused' } });
    await this.appendLog(id, 'warn', 'Paused by user');
    const dto = await this.get(id);
    this.realtime.publish({ type: 'job.updated', data: { job: dto } });
    return dto;
  }

  async cancel(id: string): Promise<Job> {
    await this.ensureExists(id);
    await this.prisma.job.update({ where: { id }, data: { status: 'failed' } });
    await this.appendLog(id, 'warn', 'Cancelled by user');
    const dto = await this.get(id);
    this.realtime.publish({ type: 'job.updated', data: { job: dto } });
    return dto;
  }

  async logs(id: string): Promise<LogEntry[]> {
    const entries = await this.prisma.logEntry.findMany({ where: { jobId: id }, orderBy: { ts: 'asc' } });
    return entries.map((l) => toLogEntry(l));
  }

  // ---- scheduler ----

  private async tick(): Promise<void> {
    try {
      const running = await this.prisma.job.findMany({ where: { status: 'running' }, include: { steps: true } });
      for (const job of running) await this.advance(job);

      const due = await this.prisma.job.findMany({
        where: { status: 'scheduled', scheduledFor: { lte: new Date() } },
        include: { steps: true, logs: true },
      });
      for (const job of due) {
        const promoted = await this.prisma.job.update({
          where: { id: job.id },
          data: { status: 'running' },
          include: { steps: true, logs: true },
        });
        await this.appendLog(job.id, 'info', 'Started');
        this.realtime.publish({ type: 'job.updated', data: { job: toJob(promoted) } });
      }
    } catch (err) {
      this.logger.error('scheduler tick failed', err as Error);
    }
  }

  private async advance(job: { id: string; progress: number; steps: { id: string; status: string }[] }): Promise<void> {
    const total = Math.max(1, job.steps.length);
    const nextProgress = Math.min(1, job.progress + 1 / (total * 6));
    const activeIndex = Math.min(total - 1, Math.floor(nextProgress * total));
    const finished = nextProgress >= 1;

    for (let i = 0; i < job.steps.length; i++) {
      const desired = finished || i < activeIndex ? 'done' : i === activeIndex ? 'running' : 'queued';
      if (job.steps[i].status !== desired) {
        await this.prisma.jobStep.update({ where: { id: job.steps[i].id }, data: { status: desired } });
      }
    }

    const updated = await this.prisma.job.update({
      where: { id: job.id },
      data: { progress: nextProgress, status: finished ? 'done' : 'running' },
      include: { steps: true, logs: true },
    });
    if (finished) await this.appendLog(job.id, 'info', 'Completed');
    this.realtime.publish({ type: 'job.updated', data: { job: toJob(updated) } });
  }

  private async appendLog(jobId: string, level: string, text: string): Promise<void> {
    await this.prisma.logEntry.create({ data: { jobId, level, text } });
  }

  private async ensureExists(id: string): Promise<void> {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
  }

  private stepsFor(title: string): string[] {
    const t = title.toLowerCase();
    if (/(scrape|review|import|summar)/.test(t)) return ['Gather sources', 'Extract data', 'Summarize'];
    if (/(build|dash)/.test(t)) return ['Scaffold', 'Wire data', 'Deploy'];
    return ['Prepare', 'Run', 'Finalize'];
  }
}
