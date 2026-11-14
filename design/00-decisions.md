# Design decisions — running log

Every decision in this document is **approved** unless marked *pending*.
Nothing in this file is a suggestion; it is the source of truth for the rebuild.

## Product

- **What it is:** a collaborative multi-agent workspace. You talk to agents, they
  gather requirements and execute work, and you stay in control via approvals.
- **Platform:** iOS (iPhone) first.
- **Vibe:** a tool, not a chatbot. No mascots, no "AI magic" language, no clichés.

## Core primitives

1. **Session** — a container: conversation + members + artifacts. Personal or
   shared. Lifecycle: create → share → archive → delete.
2. **Agent** — a persona/role with its own capabilities. Multiple, switchable.
3. **Artifact** — a saved output (list, sketch, doc, build). Editable,
   shareable, deletable.
4. **Job** — async/scheduled work with a status you check later.
5. **Person** — another human you invite into a session.

## Structure

- **Session ↔ Agent:** lead-agent orchestration. Each session has one *lead
  agent* you talk to directly; it delegates to *sub-agents*, whose work appears
  as a collapsible trace (not full chat participants).
- **Navigation:** Home hub — tabs `Home · Sessions · Agents · Jobs`, Settings via
  the avatar (top-right).

## Visual direction

- **Base:** Studio — paper & ink.
  - Accent: teal `#0F766E`
  - Neutrals: warm paper scale
  - Display type: Cormorant Garamond (display serif) + Montserrat (labels);
    body SF Pro. Fashion-editorial "System B".
- **No emojis.** Use line iconography (SF Symbols / Lucide-style strokes).

## Resolved

- Dark mode: ships, light is the default (see `01-foundations.md`).
- Display type: Cormorant Garamond + Montserrat (System B).
- No emojis — line iconography only.

## Screens

See `02-screens.md` for the screen map and per-screen decisions.

## Connections

- Optional and task-scoped. Agents start with **no** connections.
- A connection is requested (and must be approved) only when a task needs it —
  e.g. "Builder needs GitHub to push the repo." A todo list needs nothing.
- Managed in Settings → Connections (grant / revoke per service).

## Tools & actions

See `05-tools.md` for the full spec. Summary of decisions:

- **Agents can *do* things**, not just chat, via a typed **Tool** registry.
  `Agent.capabilities` stays human-readable; a new `Agent.tools: string[]` lists
  executable tools (default empty).
- **First three tools:** `create_list` (deterministic, in-process), `run_code`
  (sandboxed JS), `build_app` (static app). `run_code`/`build_app` are
  approval-gated.
- **Sandbox:** code runs in a dedicated Node Lambda — no network egress, least
  privilege, hard resource caps, ephemeral FS. Single runtime (JS) first;
  Python/matplotlib later.
- **New artifact kinds:** `list`, `image`, `data`, `app`. Blob kinds
  (`image`/`data`/`app`) live in S3; inline kinds (`list`) stay JSON.
- **Sharing:** password-protected `ShareLink` on artifacts (additive to the
  existing member `share`), with public `GET /share/:token` read-only routes.
- **Delivery order:** M1 lists + data + share links → M2 sandbox → M3 app builder.

## Backend / API

- **Transport:** Hybrid — REST (JSON) for CRUD + **one** WebSocket for the three
  realtime streams (chat deltas, approval transitions, job status). GraphQL is
  *reserved* for a later AppSync migration, not adopted now.
- **Hosting target:** AWS Free Tier — Cognito · API Gateway (REST + WebSocket) ·
  Lambda · DynamoDB · S3 · SQS/Step Functions · APNs + ActivityKit.
- **Contract:** `design/03-api.md` — data shapes + REST endpoints + WS events.
  The single source of truth for the mock server and both clients.
- **Client realtime surfacing:** cancellable streams. iOS `AsyncStream` (from
  `URLSessionWebSocketTask`) consumed via `.task`; web a typed socket emitter
  wrapped in a `useRealtime` hook. The client stays a pure transport — no UI
  state inside it.
- **Client shape:** one `APIClient` (REST CRUD) + one `RealtimeClient` (WS),
  identical method names + event types on both platforms. Config: `baseURL` +
  token provider. `design/03-api.md` §4–5 is the contract both implement.
- **Server:** no throwaway mock — a production **NestJS + TypeScript** service in
  `asd-server/`. REST + native WebSocket gateway, `class-validator` DTOs, JWT auth
  (Cognito-swappable), Prisma (SQLite now → Postgres/DynamoDB later), in-process
  job scheduler + pluggable agent engine (deterministic now, real LLM later).
  Runs locally end-to-end; AWS is a deployment + adapter swap, not a rewrite.
- **Dev auth:** clients auto-login as `alex@asd.app` (local JWT) on boot until
  Cognito is wired. Token kept in `localStorage` (web) / `TokenStore` (iOS).
- **Web wiring:** `asd-web` reads everything from the API (no seed data) — a
  single `ApiProvider` (`src/store.tsx`) holds sessions/agents/jobs/approvals,
  keeps them live via a global WS subscription + a 4s polling fallback, and
  `src/hooks.ts` streams per-session chat. Jobs tick every 1.2s (increment
  `1/(steps·6)`), so progress/steps/logs update live.
- **iOS wiring:** `asd-ios` mirrors the web — an `@MainActor AppStore`
  (`ObservableObject`, `Sources/App/AppStore.swift`) bootstraps auth + lists and
  keeps them live (global WS + 4s poll); `SessionDetailView` streams chat via a
  `.task { for await e in client.realtime.events(.session, id:) }` loop (the
  `AsyncStream` auto-unsubscribes on cancel). Seed `Models.swift` is removed;
  views consume `API.*` contract models directly.
- **LLM engine:** provider-agnostic, **user-selectable** — `LLM_PROVIDER`
  (`openai` | `anthropic` | `deepseek` | `openrouter` | `openai-compatible`) +
  `LLM_API_KEY` / `LLM_MODEL` / `LLM_BASE_URL`. One structured call per turn
  (`{ reply, trace[], approval? }`), streamed word-by-word as `message.delta`;
  **deterministic fallback** when no key is set. True multi-agent orchestration
  is deferred until real sub-agents exist. Contract: `src/llm/`.
- **Runtime settings:** LLM provider/model/key are **DB-backed** (`Setting`
  table) with `.env` as defaults; `GET/PATCH /api/v1/settings`. The API key is
  never returned (only `apiKeySet`). `LLMService` hot-reloads the provider on
  change — no restart. Global (single-workspace) for now; per-user later.
