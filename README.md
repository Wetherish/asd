# asd — collaborative multi-agent workspace

iOS-first collaborative workspace: you talk to agents, they gather requirements
and execute work, and you stay in control via approvals. Lead-agent
orchestration with a collapsible sub-agent trace; connections are optional and
task-scoped.

## Repo layout

| Path | What |
|---|---|
| `asd-web/` | Web app — Vite + React + TypeScript |
| `asd-ios/` | Native iOS — SwiftUI (XcodeGen) |
| `asd-server/` | Production backend — NestJS + Prisma (REST + WebSocket) |
| `design/` | Design decisions + API contract (source of truth) |

## Run locally

```bash
# 1. backend (http://localhost:4000 — REST /api/v1, WS /ws)
cd asd-server
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run start:dev

# 2. web (http://localhost:5173)
cd asd-web
npm install
npm run dev
```

The web app auto-logs in as `alex@asd.app`. Configure the LLM provider/key in
**Settings → Model**.

## Docs

- `design/00-decisions.md` — running decision log (source of truth)
- `design/01-foundations.md` — design tokens
- `design/02-screens.md` — screen map
- `design/03-api.md` — data shapes, REST endpoints, WebSocket events
