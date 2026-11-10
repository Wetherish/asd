# 00 — Overview

## What this is
- One cloud agent. Two thin clients: iOS, desktop (macOS + Windows).
- Clients render state and send intent. No agent logic on device.
- Agent works through tools. Anything irreversible needs approval first.

## The job
- User asks in plain language, by text or voice.
- Agent does the work: reads, composes, creates, sends.
- User sees every step and can approve, edit, or reject in one tap.

## Core principle
Chat is the interface. **Actions are visible and controllable.**

Every screen answers three questions:
1. What did it do?
2. What does it want to do?
3. What can I do about it?

## Personality
- Calm, minimal, trustworthy. A tool, not a toy.
- No mascots. No "magic". No decoration that isn't information.
- Confidence comes from clarity, not from reassurance copy.

## Tenets

| # | Tenet | Design consequence |
|---|-------|--------------------|
| 1 | Show the work | Tool status chip while working, log entry after |
| 2 | One tap to act | Approve / Edit / Reject inline, never in a menu |
| 3 | Prefer reversible | Undo for 10s after approval, then Activity log |
| 4 | Destructive is different | Red, explicit confirm, no default-accept |
| 5 | Speak human | "Checking calendar…", never `calendar.list_events` |
| 6 | Never dead-end | Every error names the next step |
| 7 | Quiet by default | Notify only on task finished + approval needed |
| 8 | Same truth everywhere | Identical labels, states, button order on both clients |

## Mental model

Four objects. Nothing else exists.

- **Session** — one conversation and its actions.
- **Message** — text in the stream. Action cards sit in the stream too.
- **Action** — one tool call with a user-visible effect. Has a lifecycle.
- **Dashboard** — agent-built artifact, opens full screen.

```
Session
 ├─ Message (text)
 ├─ Message (streaming)
 └─ Action ──> Message (result summary)
      ├─ Dashboard (optional artifact)
      └─ Log entry (always)
```

### Action lifecycle
```
proposed → pending → approved → done
                  ↘ rejected
                  ↘ expired
       approved → undone (reversible only, 10s)
       any      → failed
```
- `proposed` = agent is still preparing it. Placeholder card.
- `pending` = waiting on the user. Full card, 3 buttons.
- Only `pending` blocks. Everything else is a record.

## Scope — v1

**In**
- Four services: Calendar, Email, Slack, SMS
- Agent-generated dashboards
- Activity log, sessions, connections, settings
- Push: task finished, approval needed
- Light + dark, iPhone + macOS + Windows

**Out**
- Teams, sharing, multi-user
- Authoring new tools or prompts
- Offline agent (read-only cache at most)
- Web client, iPad-specific layout, Android

## Vocabulary

Canonical terms. Use these words in UI copy, docs, and code.

| Term | Means | Never say |
|------|-------|-----------|
| Session | One conversation | Thread, chat history |
| Action | One tool call with visible effect | Task, job, operation |
| Approval | User's yes to an action | Confirmation, permission |
| Activity log | Record of every action | Audit trail, history |
| Dashboard | Agent-generated visual | Report, chart, widget |
| Connection | A linked service + its scopes | Integration, account |
| Tool status | Live "what the agent is doing" | Thinking, processing |
| Quick action | Preset prompt chip | Suggestion, shortcut |

## Screen map — iOS

```
Tab bar:  Chat · Activity · Settings
```

- **Chat** (1) is the root. Opens last session.
  - Nav leading → Sessions (6)
  - Nav trailing → New session
- **Approval** (2) is inline in Chat. Never a modal.
- **Dashboard** (3) opens full screen from a message.
- **Activity** (4) is a tab.
- **Connections** (5) pushed from Settings.
- **Settings** (7) is a tab.
- **Push / lock screen** (8) lives outside the app.

## Screen map — desktop

```
┌──────────┬────────────────────────┬───────────────┐
│ Sidebar  │ Chat                   │ Right panel   │
│ Sessions │                        │ Dashboard  or │
│ Activity │                        │ Approvals     │
│ Connect. │                        │               │
└──────────┴────────────────────────┴───────────────┘
```

- Sidebar is navigation. Same three destinations as the iOS tabs, plus Connections.
- Right panel replaces the full-screen Dashboard and the one-at-a-time approval flow.
- Desktop adds pane management and shortcuts. It adds **no new concepts**.

## Navigation rules

- Approval is never blocking. The user can ignore it and keep typing.
- Paperwork goes inline; decisions go inline. Only destructive confirms get a sheet.
- One push depth max from a tab. Anything deeper is a modal or a sheet.
- Back returns to where you came from, never to a tab root.

## Notification policy

- Notify: task finished, approval needed, action failed.
- Never notify: routine tool steps, successful sends the user just watched.
- Approval push carries the action title + Approve / Edit inline actions.

## Spec conventions

**Units** — pt on iOS, px on desktop at 1×.
**Contrast** — measured against the surface directly behind the text.
**Modals** — MUST/SHOULD/MAY used strictly; no "should probably".
**Screen docs** — fixed headings, always in this order:

```
Purpose · Layout · Anatomy · States · Copy · Accessibility · Edge cases
```

**States** — every screen must declare: empty, loading, streaming, long-running,
error, pending, approved, rejected, destructive. `N/A` is a valid answer.

## Related
- `01-foundations.md` — colour, type, spacing, motion
- `02-components.md` — component library
- `03-ios.md` — screens 1–8
- `04-desktop.md` — desktop adaptation
- `05-notifications.md` — push + lock screen
- `06-states.md` — state matrix
- `07-accessibility.md` — AA, Dynamic Type, VoiceOver
- `08-flows.md` — four core flows
