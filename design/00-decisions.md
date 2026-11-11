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
