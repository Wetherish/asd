# TODO

Remaining work after the AWS deploy + auth/keys build.

## App features (iOS)

Voice, auth, and networking are now wired on iOS:

- [x] **Talk (voice)** — Home "Talk" + composer mic open the Talk overlay (`SFSpeechRecognizer`), routed into `createSession` / `sendMessage`.
- [x] **Auth** — login/signup screen (`AuthView`), token persisted to UserDefaults; iOS now calls `/auth/login` + `/auth/signup` (was the removed `/auth/session`).
- [x] **Server host + ATS** — single host constant in `AppStore.live()` + `NSAllowsArbitraryLoads` for the cleartext EC2 endpoint.

Still stubs:

- [ ] **Sessions search** — static/no search on both web and iOS.
- [ ] **Session share** — needs `POST /sessions/:id/members` (+ invite-by-email lookup) and a share sheet. Artifact share already works.
- [ ] **Agents add/edit** — needs `POST/PATCH /agents` on the server + forms (web + iOS).
- [ ] **Jobs "New"** — add schedule/recurring fields to the form (the form exists; `recurring` is still ignored — see Jobs section).
- [ ] **Settings** — approval-rule picker, persist notification toggles, Connections screen, editable account row. Appearance Auto already works (iOS).
- [ ] **Logout** — `AppStore.logout()` is wired but not surfaced in the UI.

## Security / authorization

- [x] **Session-level authorization** — sessions are currently visible/editable by *any* logged-in user (the `members` list is cosmetic, not enforced). Scope `GET /sessions`, `GET/PATCH/DELETE /sessions/:id`, and messages/artifacts/approvals to session members (writes limited to `owner`/`editor`).
- [ ] **TLS/HTTPS** — the API key still transits plaintext from browser → server (app is HTTP-only). Add a domain + TLS (Caddy on the host, or ACM + ALB).

## Cleanup

- [ ] Remove test users (`test2@asd.app`, `test3@asd.app`) and the dummy key from the DB + Cognito.

## Jobs

- [ ] **Recurring jobs never fire** — `recurring` is stored on `Job` but the scheduler (`JobsService.tick`) only promotes one-time `scheduledFor` jobs; the `recurring` rule is ignored entirely.
- [ ] **Replace the in-process scheduler** — jobs advance via a `setInterval` tick in `JobsService` (explicitly a placeholder). It's not durable (scheduled jobs are lost on restart) and won't work across multiple instances. Move to SQS / Step Functions.
- [ ] **Job authorization** — jobs are global: any logged-in user can list/pause/cancel every job. Scope jobs to their creator (or a shared team) like sessions.

## Tools & actions

Designed in `design/05-tools.md`. Delivery order: M1 → M2 → M3.

- [x] **M1 — lists + data + share links** — `create_list` tool, `list`/`data` artifact kinds, `ShareLink` model + `POST /artifacts/:id/share-links` + public `GET/POST /share/:token` routes (scrypt password), `Agent.tools` field. Backend + web done; iOS has `list` rendering but the share-link UI is still a follow-up.
- [x] **Engine tool loop** — `EngineService` `Script` gained `tools`, invocations run through `ToolsService`, gated to the lead agent's `tools`, with `artifact.created` emitted. Approval-gated continuation (run on `approve`) is deferred to M2.
- [x] **M2 — sandbox (local)** — `run_code` tool, `SandboxService` (node `vm` child process, timeout + output caps), `BlobService` (filesystem + `GET /files/:blobKey`), `image`/`data` outputs, and the approval-gated continuation (`Approval.pendingTool` run on `approve`).
- [ ] **M2 — sandbox (production)** — swap `SandboxService` → Lambda and `BlobService` → S3 (presigned URLs), and add `terraform` (S3 bucket, Lambda container image, least-privilege IAM, no egress). Blocked on the AWS account.
- [x] **M3 — app builder** — `build_app` tool (deterministic todo-app template → single self-contained `index.html`), `app` artifact kind (`entry`/`files`/`blobKey`/`url`), `.html` → `text/html` blob serving, and `<iframe>` rendering in the web artifact viewer + share page.
- [ ] **M3 — app builder (production)** — swap static serving to AWS (S3 + CloudFront) behind `BlobService`, and add iOS `app` rendering.
- [ ] **iOS share-link UI** — add link creation + password to the iOS `ShareArtifactSheet`, mirroring the web share sheet.
- [ ] **Verify at runtime** — apply the schema (`prisma db push` + `prisma:seed`) against a running Postgres and smoke-test the grocery-list → share-link flow (blocked on the `.env`/schema SQLite-vs-Postgres mismatch + no local DB).

## Operational

- [ ] **Provision the AWS stack + point iOS at it** — `terraform/terraform.tfstate` is currently empty (no EC2/RDS/Cognito). Run `terraform apply`, then set the iOS `host` constant (`AppStore.live()`) to the `app_url` output.
- [ ] **CI/CD** — add a GitHub Actions workflow (build → ECR → deploy) using GitHub OIDC (no static access keys). Currently there is no `.github/workflows`.
- [ ] **Remote Terraform state** — move state to S3 + DynamoDB lock. Local state holds the DB password and JWT secret in plaintext.

## User action

- [ ] Paste your real LLM API key in the app (**Settings → Model**). It's stored per-user, KMS-encrypted.
