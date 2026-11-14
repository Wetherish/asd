import {
  Agent,
  Approval,
  Artifact,
  ArtifactContent,
  ArtifactRef,
  Connection,
  Job,
  JobStep,
  LogEntry,
  Message,
  Person,
  PersonRole,
  Session,
  TraceEntry,
  iso,
} from './contract';

// Prisma record → contract DTO. Inputs are loose (`any`) because Prisma's
// `include`-augmented types are awkward to name before client generation; the
// outputs are strictly the contract shapes from `contract.ts`.
//
// SQLite has no Json type, so flexible fields are JSON-encoded strings.

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toPerson(
  user: { id: string; name: string; email: string; color: string },
  role: PersonRole,
): Person {
  return { id: user.id, name: user.name, email: user.email, color: user.color, role };
}

export function toAgent(a: any): Agent {
  return {
    id: a.id,
    name: a.name,
    description: a.description,
    capabilities: parseJson<string[]>(a.capabilities, []),
    tools: parseJson<string[]>(a.tools, []),
    status: a.status as Agent['status'],
    connections: (a.connections ?? []).map(
      (c: any): Connection => ({
        id: c.id,
        service: c.service,
        scope: c.scope,
        status: c.status as Connection['status'],
        grantedAt: c.grantedAt ? iso(c.grantedAt) : undefined,
      }),
    ),
  };
}

export function toSession(s: any): Session {
  return {
    id: s.id,
    title: s.title,
    leadAgentId: s.leadAgentId,
    members: (s.members ?? []).map((m: any): Person => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      color: m.user.color,
      role: m.role as PersonRole,
    })),
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.updatedAt),
    archived: s.archived,
  };
}

export function toTraceEntry(t: any): TraceEntry {
  return {
    id: t.id,
    agentId: t.agentId,
    title: t.title,
    status: t.status as TraceEntry['status'],
    progress: t.progress ?? undefined,
    detail: t.detail ?? undefined,
  };
}

export function toApproval(a: any): Approval {
  return {
    id: a.id,
    sessionId: a.sessionId,
    messageId: a.messageId,
    title: a.title,
    meta: a.meta,
    kind: a.kind as Approval['kind'],
    status: a.status as Approval['status'],
    actions: parseJson<string[]>(a.actions, []),
    createdAt: iso(a.createdAt),
    decidedBy: a.decidedBy ?? undefined,
    decidedAt: a.decidedAt ? iso(a.decidedAt) : undefined,
  };
}

export function toMessage(m: any): Message {
  return {
    id: m.id,
    sessionId: m.sessionId,
    role: m.role as Message['role'],
    authorId: m.authorId,
    body: m.body,
    createdAt: iso(m.createdAt),
    status: m.status as Message['status'],
    trace: (m.trace ?? []).map((t: any) => toTraceEntry(t)),
    artifacts: m.artifacts ? parseJson<ArtifactRef[]>(m.artifacts, []) : undefined,
    approval: m.approval ? toApproval(m.approval) : undefined,
  };
}

export function toArtifact(a: any): Artifact {
  return {
    id: a.id,
    sessionId: a.sessionId,
    kind: a.kind as Artifact['kind'],
    name: a.name,
    authorId: a.authorId,
    createdAt: iso(a.createdAt),
    updatedAt: iso(a.updatedAt),
    content: parseJson<ArtifactContent>(a.content, { kind: a.kind } as ArtifactContent),
    sharedWith: (a.shares ?? []).map((s: any): Person => ({
      id: s.user.id,
      name: s.user.name,
      email: s.user.email,
      color: s.user.color,
      role: s.role as PersonRole,
    })),
  };
}

export function toJobStep(s: any): JobStep {
  return {
    id: s.id,
    title: s.title,
    status: s.status as JobStep['status'],
    detail: s.detail ?? undefined,
  };
}

export function toLogEntry(l: any): LogEntry {
  return { ts: iso(l.ts), level: l.level as LogEntry['level'], text: l.text };
}

export function toJob(j: any): Job {
  return {
    id: j.id,
    title: j.title,
    agentId: j.agentId,
    status: j.status as Job['status'],
    progress: j.progress,
    createdAt: iso(j.createdAt),
    scheduledFor: j.scheduledFor ? iso(j.scheduledFor) : undefined,
    recurring: j.recurring ? { rule: j.recurring } : undefined,
    steps: (j.steps ?? []).map((s: any) => toJobStep(s)),
    logs: (j.logs ?? []).map((l: any) => toLogEntry(l)),
  };
}
