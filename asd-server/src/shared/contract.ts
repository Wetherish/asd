// Contract types for the server — mirror design/03-api.md (also mirrored in
// asd-web/src/api/types.ts and asd-ios/Sources/Networking/APIModels.swift).

export type PersonRole = 'owner' | 'editor' | 'viewer';
export type Person = { id: string; name: string; email: string; color: string; role: PersonRole };

export type Connection = {
  id: string;
  service: string;
  scope: string;
  status: 'connected' | 'available';
  grantedAt?: string;
};

export type Agent = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'paused';
  connections: Connection[];
};

export type Session = {
  id: string;
  title: string;
  leadAgentId: string;
  members: Person[];
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export type ArtifactKind = 'table' | 'doc' | 'canvas' | 'dashboard';
export type ArtifactRef = { id: string; kind: ArtifactKind; name: string };

export type TraceEntry = {
  id: string;
  agentId: string;
  title: string;
  status: 'queued' | 'working' | 'done' | 'failed';
  progress?: number;
  detail?: string;
};

export type Approval = {
  id: string;
  sessionId: string;
  messageId: string;
  title: string;
  meta: string;
  kind: 'action' | 'content';
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  actions: string[];
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
};

export type Message = {
  id: string;
  sessionId: string;
  role: 'user' | 'agent';
  authorId: string;
  body: string;
  createdAt: string;
  status: 'streaming' | 'complete' | 'error';
  trace?: TraceEntry[];
  artifacts?: ArtifactRef[];
  approval?: Approval;
};

export type ArtifactContent =
  | { kind: 'table'; columns: string[]; rows: string[][] }
  | { kind: 'doc'; body: string }
  | { kind: 'canvas'; nodes: unknown[] }
  | { kind: 'dashboard'; widgets: unknown[] };

export type Artifact = {
  id: string;
  sessionId: string;
  kind: ArtifactKind;
  name: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  content: ArtifactContent;
  sharedWith: Person[];
};

export type JobStatus = 'running' | 'scheduled' | 'done' | 'failed' | 'paused';
export type JobStep = { id: string; title: string; status: 'queued' | 'running' | 'done' | 'failed'; detail?: string };
export type LogEntry = { ts: string; level: 'info' | 'warn' | 'error'; text: string };

export type Job = {
  id: string;
  title: string;
  agentId: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  scheduledFor?: string;
  recurring?: { rule: string };
  steps: JobStep[];
  logs: LogEntry[];
};

// ---- Realtime ----
export type Scope = 'session' | 'job' | 'global';

export type RealtimeEvent =
  | { type: 'message.delta'; data: { sessionId: string; messageId: string; delta: string } }
  | { type: 'message.done'; data: { sessionId: string; messageId: string } }
  | { type: 'message.error'; data: { sessionId: string; messageId: string; error: { code: string; message: string } } }
  | { type: 'approval.created'; data: { approval: Approval } }
  | { type: 'approval.updated'; data: { approval: Approval } }
  | { type: 'job.updated'; data: { job: Job } }
  | { type: 'session.updated'; data: { session: Session } }
  | { type: 'presence'; data: { sessionId: string; people: Person[] } }
  | { type: 'pong'; data: null };

export function matchesEvent(scope: Scope, id: string, e: RealtimeEvent): boolean {
  switch (scope) {
    case 'session':
      switch (e.type) {
        case 'message.delta':
        case 'message.done':
        case 'message.error':
          return e.data.sessionId === id;
        case 'approval.created':
        case 'approval.updated':
          return e.data.approval.sessionId === id;
        case 'session.updated':
          return e.data.session.id === id;
        case 'presence':
          return e.data.sessionId === id;
        default:
          return false;
      }
    case 'job':
      return e.type === 'job.updated' && e.data.job.id === id;
    case 'global':
      return (
        e.type === 'approval.created' ||
        e.type === 'approval.updated' ||
        e.type === 'job.updated' ||
        e.type === 'session.updated'
      );
    default:
      return false;
  }
}

export const iso = (d: Date): string => d.toISOString();
