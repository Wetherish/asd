# Assistant — Interactive Web Prototype

A runnable prototype of the AI Assistant design spec in [`docs/`](docs/). It
implements the desktop client (3-pane layout) from `docs/04-desktop.md`, the
component library from `docs/02-components.md`, and the design tokens from
`docs/01-foundations.md`, with a **simulated agent** driving the real flows.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
```

## What's implemented

- **Two surfaces, one codebase** — a desktop 3-pane client and an iPhone
  surface, switched with the **Phone / Desktop** toggle in the title bar.
  Both read the same store, so state is shared.
- **3-pane shell (desktop)** — title bar, session sidebar (grouped by day,
  status dots), chat, and a right panel with an Approvals queue + Dashboard tab.
- **Phone shell (iOS)** — tab bar (Chat · Activity · Settings), push navigation
  (Sessions pushed from Chat, Connections pushed from Settings), full-screen
  dashboard cover, bottom-sheet destructive confirm, and a **lock screen /
  push preview** (`Lock screen` button) with approval + finished notifications
  and a Live Activity.
- **Chat** — user bubbles vs full-width agent prose, streaming caret, dashboard
  cards, and the `Assistant` group label.
- **Tool-status chip** — present-progressive steps (`Checking calendar… 2 of 3`),
  `Done`, `Waiting for you`, and failed (`danger`) states. One chip at a time.
- **Approval card** — the full lifecycle: `proposed` skeleton → `pending`
  (Reject · Edit · Approve) → `editing` (live inputs, `Approve edited`) →
  `approving` → `approved` (collapse + `View in activity` / 10s `Undo` where
  reversible) / `rejected` / `failed` / `expired`. Destructive cards get a
  `danger` glyph and a confirm sheet.
- **Four simulated flows** (via quick chips or typing):
  - `Check calendar` / `Summarise` — read-only, produces a dashboard card.
  - `Dashboard` — long-running, fails once then recovers via `Retry`.
  - `Send message` — email approval (irreversible, no Undo).
  - `New event` — schedule conflict → event approval.
  - typing `Delete my Friday standup` — destructive delete + confirm sheet.
- **Activity log** — search, filters, day dividers, failed-row highlighting.
- **Connections** — service rows with connect / reconnect / disconnect states.
- **Sessions** — search, grouped list, delete.
- **Settings** — model picker, approval rules (segmented), notification toggles.
- **Dashboard viewer** — KPI cards, chart cards with a11y summaries, refresh,
  delete (with Undo), "Ask the agent to change this".
- **Command bar (`⌘K`)** — actions, sessions, and free-form "Ask the agent".
- **Light / dark theme**, **toasts with Undo**, and keyboard shortcuts
  (`⌘K`, `⌘1/2/3`, `⌘,`, `⌘N`, `⌘\`, `⌘Enter`, `Esc`).

## Try it

1. Click a quick chip (e.g. **Send message**) and watch the tool chip → card →
   **Approve**.
2. Type `Delete my Friday standup` to see the destructive confirm sheet.
3. Click **Dashboard** and then **Retry** to see the failure/recovery path.
4. Press **⌘K** and type to jump to a session or ask the agent.
5. Click **Phone** to see the iPhone surface — tap the ☰ for Sessions, the
   **Settings** tab → **Connections**, and **Lock screen** for push previews.

## Structure

```
src/
  lib/        types, store (zustand), agent (simulated engine), icons, tokens, data
  components/ the component library
  views/      Chat, Activity, Connections, Sessions, Settings, Dashboard
  App.tsx     shell (title bar, 3-pane, command bar, destructive sheet, toasts)
  styles/     design tokens + global base
```

The `agent.ts` engine is the only "backend" — it advances tool steps, streams
replies, and runs approval lifecycles with real timers. Swap it for a real agent
API without touching the UI.
