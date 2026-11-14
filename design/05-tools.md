# Tools & actions

How agents *do* things — not just chat. An agent can invoke typed **tools** that
produce **artifacts** (and optionally side effects), which the user can then
**share** via a password-protected link.

The three motivating examples map onto the same shape:

| Example | Tool | Artifact |
|---|---|---|
| Grocery list for a recipe, share it | `create_list` | `list` |
| Process data + plot, return data | `run_code` | `image` + `data` |
| Build a todo app, share with friends | `build_app` | `app` |

## 1. Concepts

```ts
type ToolId = "run_code" | "create_list" | "build_app" | "fetch_url";

type Tool = {
  id: ToolId;
  name: string;
  description: string;       // shown to the LLM so it knows when/how to call it
  inputSchema: object;       // JSON Schema for args
  produces: ArtifactKind[];  // what it can emit
  needsApproval: boolean;    // gate on an Approval before running
  needsConnection?: string;  // e.g. "github" — required Connection
};

type ToolInvocation = {
  id: string;
  toolId: ToolId;
  args: unknown;                              // validated against inputSchema
  status: "queued" | "running" | "done" | "failed" | "needs_approval";
  result?: {
    artifactRef?: ArtifactRef;                // created artifact
    files?: FileRef[];                        // raw output files (blobs)
    text?: string;                            // small inline text (e.g. stdout)
    error?: string;
  };
};

type FileRef = { blobKey: string; name: string; mime: string; size: number; url?: string };
```

### Agent wiring

`Agent.capabilities` stays **human-readable labels** (`["Web", "Summarise"]`) —
they describe the agent to the user and the LLM. A new `Agent.tools: ToolId[]`
lists what the agent can actually invoke. Default empty (an agent with no tools
still chats; it just can't *do* anything).

## 2. Tool catalog (first three)

### `create_list` — deterministic, no approval
Turns prose into a checkable list. `args: { title: string; items: string[] }`,
`produces: ["list"]`. Runs in-process; no sandbox, no network, no approval.

### `run_code` — sandboxed, approval-gated
Executes a small program and returns files/plots/data. See §4 for the sandbox.

```
args: { language: "javascript", code: string, files?: FileRef[], timeoutSec?: number }
```

Single runtime for now: **JavaScript (Node)**. "It doesn't have to be
matplotlib" — plots are rendered in JS to SVG (pure-JS, no native deps); PNG and
a Python/matplotlib runtime are later additions, not day-one.

### `build_app` — approval-gated
Generates a self-contained static app (HTML/JS/CSS) and serves it at a shareable
URL. `produces: ["app"]`. First cut is a **single self-contained `index.html`**
(inline JS/CSS) stored as a blob and served read-only; multi-file bundles later.

## 3. Artifact kinds & content model

Extend `ArtifactKind` (existing `table | doc | canvas | dashboard` unchanged) and
split content storage by shape, consistent with the existing "blobs → S3" note:

- **Inline JSON** (small, editable in-app): `list`, `table`, `doc`, `canvas`,
  `dashboard`.
- **Blob** (S3 + presigned GET URL): `image`, `data`, `app`.

```ts
type ArtifactKind =
  | "table" | "doc" | "canvas" | "dashboard"    // existing
  | "list" | "image" | "data" | "app";

type ListItem = { id: string; text: string; checked: boolean; group?: string };
type AppFile  = { path: string; body: string; language: string };

type ArtifactContent =
  | /* existing … */
  | { kind: "list";  items: ListItem[] }
  | { kind: "image"; mime: string; blobKey: string; url?: string; alt?: string }
  | { kind: "data";  format: "csv" | "json"; blobKey: string; url?: string;
      preview?: { columns: string[]; rows: string[][] } }
  | { kind: "app";   entry: string; files: AppFile[]; blobKey?: string; url?: string };
```

Blob kinds are **not** `PATCH`-editable in-app (their content is a file); `list`
is. `preview` on `data` lets the viewer show a table without downloading the file.

## 4. Sandbox execution (`run_code`)

Code runs in a **dedicated Lambda** (container image, Node runtime), never in the
API process. A thin wrapper receives `{ code, files }`, runs it with a timeout,
captures `stdout`/`stderr`, and returns `{ exitCode, stdout, stderr, files }`
where `files` are bytes the program wrote. The engine uploads files to S3 and maps
them by extension/mime: `*.svg|*.png` → `image`, `*.csv|*.json` → `data`.

**Non-negotiable mitigations** (this is the risky part, deliberately chosen):

- **No network egress** by default — egress requires a Connection + approval.
- **Least-privilege role** — `PutObject` to a single S3 prefix only; zero access
  to the DB, KMS, or anything else.
- **Hard caps** — memory 128–512 MB, timeout default 10 s, output ≤ a few MB,
  per-user concurrency + rate limit.
- **Ephemeral** `/tmp` only; no credentials in the environment.
- Long term: run in a **separate AWS account** behind a locked-down role. Not
  required day one, but plan for it.

**Implementation note.** Local dev uses a `SandboxService` that spawns a child
`node` process and runs the code in a restricted `vm` context (no
`require`/`process`/`fs`/`fetch`; only `save`/`saveJSON`/`console` are exposed),
with a wall-clock kill + `vm` timeout. The Lambda path is the production swap
behind the same `SandboxService.run` interface, and is **not yet implemented**
(it needs the AWS account + `terraform` additions). The local sandbox is *not* a
security boundary — it is a dev approximation of the Lambda sandbox.

## 5. Share links (password-protected)

Additive to the existing `POST /artifacts/:id/share` (which shares to already-
invited `personIds`). Links share to people *outside* the session.

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

- `POST /artifacts/:id/share-links` `{ password?, expiresAt? }` → `{ id, url }`.
- `GET /share/:token` → `{ needsPassword: true }` or the read-only artifact view.
- `POST /share/:token/unlock` `{ password }` → short-lived access token/cookie.
- `DELETE /artifacts/:id/share-links/:linkId` → revoke.

The `GET /share/*` routes are the only new `@Public()` routes. A blob artifact
served through a link returns its presigned URL; an `app` returns the app.

## 6. Engine flow

The engine `Script` gains a `tools` field; each invocation runs through a
`ToolRegistry`, emits a `TraceEntry`, and may create an artifact.

```ts
type Script = {
  text: string;
  trace: { agentId: string; title: string }[];
  approval?: { title: string; meta: string };
  tools?: { toolId: ToolId; args: unknown }[];
  artifact?: { kind: string; name: string; content: unknown };  // legacy, retained
};
```

Sequence for a turn with tools:

1. Resolve script (LLM or deterministic fallback) — includes `tools`.
2. Stream `reply` (unchanged).
3. For each tool: create a `TraceEntry` (`working`), validate `args`, then
   - `needsApproval` → surface an `Approval`, mark invocation `needs_approval`;
     run only after `approve` (continuation hook resumes the turn).
   - else → run via the registry; write any blob to S3; create the artifact;
     mark `done` / `failed`.
4. Attach `ArtifactRef[]` to the message, publish `artifact.created` + `message.done`.

The `run_code` and `build_app` tools are async (sandbox call); they publish
`artifact.created` when their artifact is ready.

## 7. LLM integration

Keep the current prompt-based JSON mode (providers have no native tool calling).
The system prompt lists the agent's `tools` (`id`, `description`, `inputSchema`),
and the JSON shape gains `"tools":[{"toolId":"…","args":{…}}]`. Native function
calling (OpenAI `tools` param / Anthropic tool use) is a later optimization, not
a day-one requirement.

## 8. API surface (added to `03-api.md`)

- `ArtifactKind` + `ArtifactContent` extended (§3).
- `Agent.tools: string[]`.
- `ToolInvocation`, `FileRef`, `ShareLink` types.
- Endpoints: `POST /artifacts/:id/share-links`, `GET /share/:token`,
  `POST /share/:token/unlock`, `DELETE /artifacts/:id/share-links/:linkId`.
- Realtime: `artifact.created` / `artifact.updated` (new) —
  `{ sessionId, artifact }`.

## 9. Data model (Prisma)

- `Agent.tools String @default("[]")` (JSON-encoded `ToolId[]`).
- Blob metadata (`blobKey`, `mime`, `url`) lives inside the artifact `content`
  JSON — no new `Artifact` columns (consistent with how `table`/`doc` already
  store their content).
- New `ShareLink` model: `id`, `artifactId`, `token @unique`,
  `passwordHash?`, `expiresAt?`, `revoked`, `createdAt`.
- `Approval.pendingTool String?` — JSON `{ toolId, args }` for an approval-gated
  tool, run on `approve` (the continuation hook).
- `ToolInvocation` is **not** a new table for v1 — it is carried in the message
  `artifacts`/`trace` and the reply; persist only if a resumable audit trail is
  needed later.

## 10. Delivery order

1. **M1 — lists + data + share links** (no sandbox): `create_list`, `list`/`data`
   kinds, `ShareLink` + password flow. Ships "grocery list, share with someone".
2. **M2 — sandbox**: `run_code` + Node Lambda + S3 blobs, `image`/`data` outputs.
   Ships "process data, return a plot + data".
3. **M3 — app builder**: `build_app` + `app` kind + static serving + share.
   Ships "todo app, share with friends".

## 11. Implementation status

- **M1 done** (backend + web; iOS list rendering): `create_list`, `list`/`data`
  kinds, `Agent.tools`, `ShareLink` + password flow, public `GET /share/:token`.
- **M2 done locally** (backend + web): `SandboxService` (node `vm` child process
  with timeout + output caps), `BlobService` (filesystem + `GET /files/:blobKey`
  capability URL), `run_code` → `image`/`data`, and the approval-gated
  continuation (`Approval.pendingTool` run on `approve`).
- **M2 production (pending):** S3 + presigned URLs behind `BlobService`, Lambda
  sandbox behind `SandboxService`, plus `terraform` (S3 bucket, Lambda container
  image, least-privilege IAM). Neither is wired until the AWS account exists.
- **M3 done locally** (backend + web): `build_app` (deterministic todo-app
  template → a single self-contained `index.html`), the `app` kind
  (`entry`/`files`/`blobKey`/`url`), `.html` → `text/html` blob serving, and
  `app` rendered in an `<iframe>` in the artifact viewer + share page.
- **M3 production (pending):** AWS static hosting swap (S3 + CloudFront) behind
  the `BlobService` interface, plus iOS `app` rendering.
