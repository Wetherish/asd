# Plan — AI Assistant Design Spec

## Decision
- Deliverable = **written design spec only**.
- No HTML, no SwiftUI, no code, no rendered mockups.
- Specs must be build-ready: if a dev can't build from it, it's not done.

## Output
```
docs/
  README.md             index, decisions, precedence
  00-overview.md        product frame, principles, glossary
  01-foundations.md     colour, type, spacing, motion, iconography
  02-components.md      component library
  03-ios.md             screens 1-8 (iPhone)
  04-desktop.md         chat, activity, dashboard (3-pane)
  05-notifications.md   push + lock screen
  06-states.md          state matrix, per screen
  07-accessibility.md   AA, Dynamic Type, VoiceOver, targets
  08-flows.md           4 core flows, step by step
```
- One file per area. Cross-link, don't duplicate.

## Build order
1. `00` + `01` — tokens first, everything hangs off them
2. `02` — components before screens
3. `03` — iOS screens, phone first
4. `04` — desktop adaptation
5. `05` + `06` — notifications, state matrix
6. `07` + `08` — accessibility, flows
7. Pass: jargon sweep, consistency audit

## Foundations (draft to lock in step 1)
- **Accent:** one colour. Proposal: deep indigo `#2E5BD7`. Verify ≥4.5:1 on both surfaces.
- **Neutrals:** true grey scale, 8 steps, light + dark pairs.
- **Semantic:** success / warning / danger — used *only* for state, never decoration.
- **Type:** SF Pro (iOS + macOS), Segoe UI Variable fallback (Windows).
- **Scale:** 6 sizes, 3 weights. Body 17pt iOS / 15px desktop.
- **Spacing:** 4pt base, 5 steps (4/8/16/24/32).
- **Radius:** 3 values (chip 999, card 12, sheet 20).
- **Motion:** 2 durations, 1 easing. No bounce.

## iOS screens — spec sections per screen
Each screen doc gets: purpose, layout map, anatomy, states, edge cases, a11y notes, copy.
1. **Chat** — stream, voice, input bar, quick chips, tool-status chip.
2. **Approval card** — preview, 3 buttons, inline edit, confirmed + undo.
3. **Dashboard viewer** — full screen, share, refresh, "ask to change".
4. **Activity log** — timeline, filters, failure highlight.
5. **Connections** — service rows, permissions, connect/disconnect.
6. **Sessions** — history list, search.
7. **Settings** — model, notifications, approval rules.
8. **Push / lock screen** — task finished, approval needed.

## Component library (spec: anatomy, variants, states, sizes, a11y label)
- Message bubble (user / agent / streaming / error)
- Approval card (pending / editing / approved / rejected / expired)
- Tool-status chip (`Checking calendar…`)
- Connection row (connected / disconnected / expired / error)
- Log entry (success / failed / running)
- Supporting: quick chip, input bar, filter bar, empty state, banner

## Desktop adaptation
- 3 panes: sidebar (sessions / activity / connections) · chat · right panel (dashboard or approvals queue)
- Resizable panes, min widths, collapse rules
- Cmd+K command bar · Cmd+Enter approve · Esc reject
- Menu-bar quick input
- Table density: compact rows, hover states, focus rings

## States matrix (`06-states.md`)
Rows = screens. Columns = empty / loading / streaming / long-running / error / pending / approved / rejected / destructive.
- Mark N/A explicitly.
- One line of copy per cell, not prose.

## Accessibility rules (non-negotiable, in every screen doc)
- 44×44pt iOS targets, 32×32 desktop minimum
- AA contrast on all text + state colours
- Dynamic Type up to AX5; nothing truncates at 320pt width
- VoiceOver label + hint for every control; approval card reads as one group
- No colour-only meaning; no motion-only feedback

## Copy rules
- Verb-first buttons: Approve · Edit · Reject · Undo
- Tool status: present progressive, ≤3 words ("Checking calendar…")
- Errors: what failed, what's safe, what to do next. No blame.
- No mascots, no "AI magic" language.

## Assumptions
- English only
- iOS 17+ / macOS 14+ / Windows 11
- One accent; services may show brand marks only inside their own rows
- Voice = iOS speech + live waveform strip; no separate voice screen

## Open questions
None. All resolved — see `06-states.md` §7 and `docs/README.md`.
