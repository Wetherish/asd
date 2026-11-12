# asd-server

Production backend for **asd** — REST + WebSocket, implementing
`design/03-api.md`.

- **Runtime:** NestJS + TypeScript
- **Persistence:** Prisma (SQLite for local dev — zero setup — swap to
  Postgres/DynamoDB behind the same repository interfaces)
- **Auth:** local JWT (Cognito-swappable)
- **Realtime:** native WebSocket gateway at `/ws`
- **Agent engine:** real LLM (selectable provider) with a deterministic fallback
- **Jobs:** in-process scheduler (placeholder for SQS/Step Functions)

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate     # create/apply the PostgreSQL schema
npm run prisma:seed        # seed agents, sessions, jobs, a pending approval
npm run start:dev          # http://localhost:4000  (REST /api/v1, WS /ws)
```

Reset everything:

```bash
npm run db:reset
```

## Deploy with Docker

```bash
cd asd-server
# set JWT_SECRET (required) and optional LLM_* / CORS_ORIGIN in .env
cp .env.example .env   # then edit it
docker compose up -d --build
```

This brings up **PostgreSQL** (the `db` service) and the app. The server
listens on `http://localhost:4000` (REST `/api/v1`, WS `/ws`).

On start the container:

1. applies pending migrations (`prisma migrate deploy`), and
2. seeds the database (idempotent upserts — disable with `SEED_ON_START=false`),
3. then launches the compiled app.

Key environment variables (see `.env.example` for the full list):

| Var | Notes |
|-----|-------|
| `JWT_SECRET` | **Required.** Long random value for signing tokens. |
| `DATABASE_URL` | PostgreSQL URL, e.g. `postgresql://asd:asd@localhost:5432/asd`. |
| `PORT` | `4000` inside the container; mapped to the host in `docker-compose.yml`. |
| `CORS_ORIGIN` | Comma-separated allowlist, or `*` to reflect any origin. |
| `LLM_PROVIDER` / `LLM_API_KEY` / `LLM_MODEL` / `LLM_BASE_URL` | Optional; empty key → deterministic fallback engine. |

Build a standalone image without Compose (point it at any Postgres):

```bash
docker build -t asd-server .
docker run --rm -p 4000:4000 \
  -e DATABASE_URL=postgresql://asd:asd@localhost:5432/asd \
  -e JWT_SECRET=change-me \
  asd-server
```

### Production (AWS)

A full CI/CD pipeline (GitHub Actions → ECR → EC2 + RDS, provisioned with
Terraform) lives in the repo root — see [`../DEPLOY.md`](../DEPLOY.md).

## Layout

```
src/
  main.ts / app.module.ts     bootstrap, global prefix, guard, modules
  shared/contract.ts          API types + realtime routing
  shared/mappers.ts           Prisma record → contract DTO
  common/                     JWT guard, Public/CurrentUser decorators
  prisma/                     PrismaClient provider (global)
  realtime/                   WebSocket gateway + pub/sub service
  engine/                     deterministic agent turn (streams deltas)
  auth/  users(/me)  agents/  sessions/  messages/  approvals/  artifacts/  jobs/
```

## Contract

See `design/03-api.md`. Every route + WebSocket event is implemented there.

- REST base: `/api/v1`
- WS: `ws://localhost:4000/ws?token=<jwt>`

## Auth

`POST /api/v1/auth/session` with `{ "email": "alex@asd.app" }` returns
`{ token, user }`. Pass `Authorization: Bearer <token>` on all other routes.

## LLM engine

The agent engine calls a real LLM when a key is configured, and falls back to
the deterministic script otherwise. Provider is user-selectable:

| Var | Values |
|---|---|
| `LLM_PROVIDER` | `openai` (default) · `anthropic` · `deepseek` · `openrouter` · `openai-compatible` |
| `LLM_API_KEY` | provider key; empty → deterministic fallback |
| `LLM_MODEL` | e.g. `gpt-4o-mini` (default) · `claude-3-5-sonnet-20241022` · `deepseek-chat` · `deepseek/deepseek-chat` (OpenRouter) |
| `LLM_BASE_URL` | override endpoint (required for self-hosted/openai-compatible) |

DeepSeek and OpenRouter ship as first-class providers (both OpenAI-compatible):

```bash
# DeepSeek directly
LLM_PROVIDER=deepseek LLM_API_KEY=sk-... LLM_MODEL=deepseek-chat npm run start:dev

# Any model through OpenRouter (one key, provider/model strings)
LLM_PROVIDER=openrouter LLM_API_KEY=sk-or-... LLM_MODEL=anthropic/claude-3.5-sonnet npm run start:dev
```

Example:

```bash
LLM_PROVIDER=openai LLM_API_KEY=sk-... LLM_MODEL=gpt-4o-mini npm run start:dev
```

Each turn makes one structured call (`{ reply, trace[], approval? }`) and
streams `reply` word-by-word as `message.delta` events, then persists the trace
and any approval. Providers live in `src/llm/` behind the `LLMProvider`
interface, so adding a new one is a single class + a factory case.
