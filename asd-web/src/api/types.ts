// Mirrors design/03-api.md — single source of truth for the web client.

// ---- Identity ----
export type PersonRole = "owner" | "editor" | "viewer";
export type Person = {
  id: string;
  name: string;
  email: string;
  color: string;
  role: PersonRole;
};

export type ConnectionStatus = "connected" | "available";
export type Connection = {
  id: string;
  service: string;
  scope: string;
  status: ConnectionStatus;
  grantedAt?: string;
};

export type AgentStatus = "active" | "paused";
export type Agent = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  tools: string[];
  status: AgentStatus;
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

// ---- Chat ----
export type MessageRole = "user" | "agent";
export type MessageStatus = "streaming" | "complete" | "error";
export type ArtifactKind = "table" | "doc" | "canvas" | "dashboard" | "list" | "image" | "data" | "app";
export type ArtifactRef = { id: string; kind: ArtifactKind; name: string };

export type TraceStatus = "queued" | "working" | "done" | "failed";
export type TraceEntry = {
  id: string;
  agentId: string;
  title: string;
  status: TraceStatus;
  progress?: number;
  detail?: string;
};

export type ApprovalStatus = "pending" | "approved" | "rejected" | "edited";
export type ApprovalKind = "action" | "content";
export type Approval = {
  id: string;
  sessionId: string;
  messageId: string;
  title: string;
  meta: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  actions: string[];
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
};

export type Message = {
  id: string;
  sessionId: string;
  role: MessageRole;
  authorId: string;
  body: string;
  createdAt: string;
  status: MessageStatus;
  trace?: TraceEntry[];
  artifacts?: ArtifactRef[];
  approval?: Approval;
};

// ---- Artifacts ----
export type CanvasNode = {
  id: string;
  type: "note" | "shape" | "text";
  x: number;
  y: number;
  data?: unknown;
};
export type Widget = { id: string; type: string; data?: unknown };

export type ListItem = { id: string; text: string; checked: boolean; group?: string };
export type AppFile = { path: string; body: string; language: string };

export type ArtifactContent =
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "doc"; body: string }
  | { kind: "canvas"; nodes: CanvasNode[] }
  | { kind: "dashboard"; widgets: Widget[] }
  | { kind: "list"; items: ListItem[] }
  | { kind: "image"; mime: string; blobKey: string; url?: string; alt?: string }
  | { kind: "data"; format: "csv" | "json"; blobKey: string; url?: string;
      preview?: { columns: string[]; rows: string[][] } }
  | { kind: "app"; entry: string; files: AppFile[]; blobKey?: string; url?: string };

export type FileRef = { blobKey: string; name: string; mime: string; size: number; url?: string };

export type ShareLink = {
  id: string;
  artifactId: string;
  token: string;
  passwordHash?: string;
  expiresAt?: string;
  revoked: boolean;
  createdAt: string;
};

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

// ---- Jobs ----
export type JobStatus = "running" | "scheduled" | "done" | "failed" | "paused";
export type JobStepStatus = "queued" | "running" | "done" | "failed";
export type JobStep = { id: string; title: string; status: JobStepStatus; detail?: string };
export type LogLevel = "info" | "warn" | "error";
export type LogEntry = { ts: string; level: LogLevel; text: string };
export type Job = {
  id: string;
  title: string;
  agentId: string;
  status: JobStatus;
  progress: number; // 0..1
  createdAt: string;
  scheduledFor?: string;
  recurring?: { rule: string };
  steps: JobStep[];
  logs: LogEntry[];
};

// ---- Settings ----
export type Settings = {
  provider: string;
  model: string;
  baseUrl: string;
  apiKeySet: boolean;
};
export type UpdateSettingsInput = {
  provider?: string;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
};

// ---- Errors ----
export type ApiErrorBody = { code: string; message: string; details?: unknown };
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// ---- Realtime ----
export type Scope = "session" | "job" | "global";

export type RealtimeEvent =
  | { type: "message.delta"; data: { sessionId: string; messageId: string; delta: string } }
  | { type: "message.done"; data: { sessionId: string; messageId: string } }
  | { type: "message.error"; data: { sessionId: string; messageId: string; error: ApiErrorBody } }
  | { type: "artifact.created"; data: { sessionId: string; artifact: Artifact } }
  | { type: "artifact.updated"; data: { sessionId: string; artifact: Artifact } }
  | { type: "approval.created"; data: { approval: Approval } }
  | { type: "approval.updated"; data: { approval: Approval } }
  | { type: "job.updated"; data: { job: Job } }
  | { type: "session.updated"; data: { session: Session } }
  | { type: "presence"; data: { sessionId: string; people: Person[] } }
  | { type: "pong"; data: null };

export function isRealtimeEvent(v: unknown): v is RealtimeEvent {
  return typeof v === "object" && v !== null && "type" in v && "data" in v;
}
