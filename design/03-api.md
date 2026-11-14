# API contract

Single source of truth for the backend. The local mock server (step 3) and both
clients (step 2) implement exactly this. Decisions here are **approved** and
recorded in `00-decisions.md`.

## 1. Transport

- **REST (JSON)** for all CRUD — sessions, agents, artifacts, jobs, people,
  approvals, messages.
- **One WebSocket** for realtime — chat deltas, approval transitions, job status.
- GraphQL is **not** used now; reserved for a later AppSync migration.

Base URL: `/api/v1`.

## 2. Conventions

| Concern | Rule |
|---|---|
| Auth | `Authorization: Bearer <token>` (Cognito JWT later; dev token in mock). |
| IDs | Opaque strings. Mock uses readable slugs (`"vacuum"`, `"build-dash"`). |
| Timestamps | ISO 8601 UTC (`2026-11-11T09:00:00Z`). |
| Enums | Lowercase strings, exactly as spelled in the tables below. |
| Errors | `{ "error": { "code": string, "message": string, "details?": object } }` with an appropriate HTTP status. |
| Pagination | Cursor-based where noted (`?cursor=` + `nextCursor` in the response). List endpoints default to uncapped for the mock. |
| Numbers | `progress` is a float `0…1`; percentages are client-rendered. |
| Currency/price | Free-form `string` in `meta` (e.g. `"£429 · delivers Thursday"`); no numeric money type yet. |

### Error codes

`unauthorized`, `forbidden`, `not_found`, `validation`, `conflict`,
`rate_limited`, `internal`.

## 3. Data model

### Person

```ts
type Person = {
  id: string;
  name: string;
  email: string;
  color: string;              // presence-dot color (no initials, per 02-screens)
  role: "owner" | "editor" | "viewer";
};
```

### Connection

```ts
type Connection = {
  id: string;
  service: string;            // "github" | "calendar" | "drive" | …
  scope: string;              // human-readable grant, e.g. "repo:asd/*"
  status: "connected" | "available";
  grantedAt?: string;
};
```

### Agent

```ts
type Agent = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];      // human-readable labels ("Web", "Summarise")
  tools: string[];             // executable ToolId[] — what it can actually invoke
  status: "active" | "paused";
  connections: Connection[];
};
```

### Session

```ts
type Session = {
  id: string;
  title: string;
  leadAgentId: string;        // the one lead agent you talk to directly
  members: Person[];          // invited humans
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};
```

### Message

```ts
type Message = {
  id: string;
  sessionId: string;
  role: "user" | "agent";
  authorId: string;           // agent id or Person id
  body: string;               // markdown prose
  createdAt: string;
  status: "streaming" | "complete" | "error";
  trace?: TraceEntry[];       // collapsible sub-agent trace (lead orchestration)
  artifacts?: ArtifactRef[];  // artifact chips → open Artifacts
  approval?: Approval;        // inline approval, when the turn produces one
};
```

### TraceEntry

```ts
type TraceEntry = {
  id: string;
  agentId: string;            // sub-agent doing this piece
  title: string;
  status: "queued" | "working" | "done" | "failed";
  progress?: number;          // 0…1
  detail?: string;
};
```

### ArtifactRef

```ts
type ArtifactRef = { id: string; kind: ArtifactKind; name: string };
```

### Approval

```ts
type Approval = {
  id: string;
  sessionId: string;
  messageId: string;          // the message that surfaced it
  title: string;
  meta: string;               // e.g. "Email · ready to send"
  kind: "action" | "content";
  status: "pending" | "approved" | "rejected" | "edited";
  actions: string[];          // allowed verbs, e.g. ["approve","edit","reject"]
  createdAt: string;
  decidedBy?: string;
  decidedAt?: string;
};
```

### Artifact

```ts
type ArtifactKind = "table" | "doc" | "canvas" | "dashboard" | "list" | "image" | "data" | "app";

type Artifact = {
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

type ArtifactContent =
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "doc"; body: string }                       // markdown
  | { kind: "canvas"; nodes: CanvasNode[] }
  | { kind: "dashboard"; widgets: Widget[] }
  | { kind: "list"; items: ListItem[] }
  | { kind: "image"; mime: string; blobKey: string; url?: string; alt?: string }
  | { kind: "data"; format: "csv" | "json"; blobKey: string; url?: string;
      preview?: { columns: string[]; rows: string[][] } }
  | { kind: "app"; entry: string; files: AppFile[]; blobKey?: string; url?: string };

type CanvasNode = { id: string; type: "note" | "shape" | "text"; x: number; y: number; data: unknown };
type Widget = { id: string; type: string; data: unknown };   // keep loose for now
type ListItem = { id: string; text: string; checked: boolean; group?: string };
type AppFile = { path: string; body: string; language: string };

type FileRef = { blobKey: string; name: string; mime: string; size: number; url?: string };
```

### Job

```ts
type JobStatus = "running" | "scheduled" | "done" | "failed" | "paused";

type Job = {
  id: string;
  title: string;
  agentId: string;
  status: JobStatus;
  progress: number;           // 0…1
  createdAt: string;
  scheduledFor?: string;      // present when status === "scheduled"
  recurring?: { rule: string };   // e.g. "Every Monday · 9:00"
  steps: JobStep[];
  logs: LogEntry[];
};
```

### JobStep / LogEntry

```ts
type JobStep = {
  id: string;
  title: string;
  status: "queued" | "running" | "done" | "failed";
  detail?: string;
};

type LogEntry = {
  ts: string;
  level: "info" | "warn" | "error";
  text: string;
};
```

### ShareLink

```ts
type ShareLink = {
  id: string;
  artifactId: string;
  token: string;            // 256-bit random, in the URL
  passwordHash?: string;    // scrypt `salt:hash` — optional
  expiresAt?: string;
  revoked: boolean;
  createdAt: string;
};
```

### ToolInvocation

```ts
type ToolInvocation = {
  id: string;
  toolId: string;           // "run_code" | "create_list" | "build_app" | …
  args: unknown;            // validated against the tool's inputSchema
  status: "queued" | "running" | "done" | "failed" | "needs_approval";
  result?: {
    artifactRef?: ArtifactRef;
    files?: FileRef[];
    text?: string;
    error?: string;
  };
};
```

## 4. REST endpoints

### Auth & me

| Method | Path | Body → Response |
|---|---|---|
| POST | `/auth/session` | `{ email }` → `{ token, user: Person }` (mock login; Cognito later) |
| GET | `/me` | → `Person` |

### Agents

| Method | Path | Response |
|---|---|---|
| GET | `/agents` | `Agent[]` |
| GET | `/agents/:id` | `Agent` |

### Sessions

| Method | Path | Notes |
|---|---|---|
| GET | `/sessions` | `Session[]`, newest first |
| POST | `/sessions` | `{ title, leadAgentId, memberIds? }` → `Session` |
| GET | `/sessions/:id` | `Session` |
| PATCH | `/sessions/:id` | `{ title? }` → `Session` |
| DELETE | `/sessions/:id` | archive (soft); 204 |
| GET | `/sessions/:id/messages` | `Message[]`; cursor paginated via `?cursor=` |
| POST | `/sessions/:id/messages` | `{ body }` → `Message` (`status:"streaming"`); deltas then stream over WS |
| GET | `/sessions/:id/artifacts` | `Artifact[]` |

### Approvals

| Method | Path | Notes |
|---|---|---|
| GET | `/approvals?status=pending` | `Approval[]` — feeds Home "Needs you" |
| POST | `/approvals/:id/decide` | `{ action: "approve" | "reject" | "edit", edits? }` → `Approval` |

### Artifacts

| Method | Path | Notes |
|---|---|---|
| GET | `/artifacts/:id` | `Artifact` (generic viewer opens any kind) |
| POST | `/sessions/:id/artifacts` | `{ kind, name, content? }` → `Artifact` |
| PATCH | `/artifacts/:id` | `{ name? , content? }` → `Artifact` |
| DELETE | `/artifacts/:id` | 204 |
| POST | `/artifacts/:id/share` | `{ personIds, role? }` → `Artifact` |

### Share links (public, password-protected)

| Method | Path | Notes |
|---|---|---|
| POST | `/artifacts/:id/share-links` | `{ password?, expiresAt? }` → `{ id, url }` |
| GET | `/share/:token` | `@Public()` — `{ needsPassword: true }` or the read-only artifact view |
| POST | `/share/:token/unlock` | `@Public()` — `{ password }` → short-lived access token/cookie |
| DELETE | `/artifacts/:id/share-links/:linkId` | revoke |

### Jobs

| Method | Path | Notes |
|---|---|---|
| GET | `/jobs` | `Job[]` (grouped client-side by status) |
| POST | `/jobs` | `{ title, agentId, scheduledFor?, recurring? }` → `Job` |
| GET | `/jobs/:id` | `Job` |
| POST | `/jobs/:id/pause` | `Job` |
| POST | `/jobs/:id/cancel` | `Job` |
| GET | `/jobs/:id/logs` | `LogEntry[]`; cursor paginated |

## 5. WebSocket

Connect: `WS /ws?token=<token>`. Messages are JSON envelopes
`{ type, data, ts }`. The client may connect a single socket and subscribe to
multiple scopes.

### Client → server

| Type | Data |
|---|---|
| `subscribe` | `{ scope: "session" | "job" | "global", id: string }` |
| `unsubscribe` | `{ scope, id }` |
| `ping` | — |

### Server → client

| Type | Data | When |
|---|---|---|
| `message.delta` | `{ sessionId, messageId, delta }` | streaming chat |
| `message.done` | `{ sessionId, messageId }` | turn complete |
| `message.error` | `{ sessionId, messageId, error }` | turn failed |
| `artifact.created` | `{ sessionId, artifact }` | a tool produced an artifact |
| `artifact.updated` | `{ sessionId, artifact }` | artifact edited / shared |
| `approval.created` | `{ approval }` | new approval surfaced |
| `approval.updated` | `{ approval }` | decided / edited |
| `job.updated` | `{ job }` | progress, step, or status change |
| `session.updated` | `{ session }` | shared/renamed (presence + members) |
| `presence` | `{ sessionId, people: Person[] }` | members join/leave |
| `pong` | — | keepalive |

### Example stream

```
→ { type:"subscribe", scope:"session", id:"vacuum" }
← { type:"message.delta", data:{ sessionId:"vacuum", messageId:"m_42", delta:"Found three vacuums" } }
← { type:"message.delta", data:{ sessionId:"vacuum", messageId:"m_42", delta:" in budget. Builder is pulling live prices." } }
← { type:"message.done",  data:{ sessionId:"vacuum", messageId:"m_42" } }
← { type:"approval.created", data:{ approval:{ id:"a_1", title:"Order the Shark RV1000?", status:"pending" } } }
```

## 6. Polling fallback

When the WS drops (mobile backgrounding, network), clients fall back to polling:
- Jobs: `GET /jobs/:id` every 3s while `status === "running"`.
- Approvals: `GET /approvals?status=pending` on foreground.
- Streaming messages: re-fetch `GET /sessions/:id/messages` to recover the final
  `complete` message if a delta stream is interrupted.

## 7. AWS mapping (later, not now)

| Contract | AWS |
|---|---|
| REST | API Gateway (REST) → Lambda → DynamoDB |
| WebSocket | API Gateway (WebSocket API) / AppSync → Lambda |
| Auth | Cognito User Pools (JWT) |
| Artifact blobs | S3 (presigned URLs) |
| Sandbox code execution (`run_code`) | Lambda (container image, Node, no egress) |
| Scheduled/recurring jobs | EventBridge / Step Functions |
| Job queues | SQS |
| Push + Live Activity | SNS → APNs + ActivityKit |

The mock server implements the same contract behind `http://localhost:4000`, so
swapping to AWS later is a base-URL change, not a client rewrite.
