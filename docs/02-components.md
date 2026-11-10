# 02 — Components

Shared by both clients. Desktop values in parentheses.
Tokens from `01-foundations.md`. No local colours, sizes, or shadows.

## Inventory

| Component | Screens |
|-----------|---------|
| Button | all |
| Status pill | all |
| Quick-action chip | 1 |
| Tool-status chip | 1, 3 |
| Message bubble | 1 |
| Approval card | 1, 2, desktop right panel |
| Composer | 1 |
| Voice waveform | 1 |
| Connection row | 5 |
| Log entry | 4, 3 |
| Filter bar | 4, 6 |
| Banner | 1, 3, 5, 7 |
| Empty state | all |

---

## 1. Button

**Anatomy** — label only. Optional leading icon, 16pt, gap `space-2`.

**Variants**

| Variant | Fill | Text | Use |
|---------|------|------|-----|
| Primary | `accent` | `accent-on` | One per card. Approve, Connect, Send |
| Secondary | `surface` + `border` | `text-primary` | Edit, Reject, Cancel |
| Ghost | none | `accent` | Tertiary, inline "View in activity" |
| Destructive | `danger` | `text-inverse` | Confirm delete/disconnect only |

**Sizes**

| | Height | Padding-x | Type |
|---|---|---|---|
| Regular | 44 (36) | 16 (14) | Headline / Headline |
| Small | 32 (28) | 12 | Subhead / Small |

**States** — default, pressed (`accent-pressed`, no scale), disabled (`text-tertiary` on `surface`), loading (label swaps to "Approving…", no spinner, width locked).

**Rules**
- One primary per card or sheet. Never two.
- Primary sits rightmost in a horizontal group.
- Loading state keeps the same width. No layout jump.
- Destructive never gets primary styling. Red fill + explicit verb.

**A11y** — label is the verb. No icon-only buttons. 44×44 min hit area even for Small.

---

## 2. Status pill

**Anatomy** — 6pt dot or 12pt glyph + label, `radius-pill`, height 22 (20).
**Colours** — tint from `success` / `warning` / `danger` / `text-tertiary`.
Label is `text-primary`; the dot carries the colour.
**Labels** — Pending · Approved · Undone · Rejected · Expired · Failed · Done · Connected.

**Rules**
- Always text + colour. Never a dot alone.
- Sentence case. No all-caps.
- Max 12 characters.

**A11y** — read as "Status: Approved". Not a button.

---

## 3. Quick-action chip

**Anatomy** — optional 14pt icon + label.

| | Value |
|---|---|
| Height | 36 (28) |
| Padding | 14 x |
| Radius | `radius-pill` |
| Default | `surface` + `border`, `text-primary`, Subhead |
| Pressed | `accent-tint` + `accent` text |
| Selected | `accent` fill, `accent-on` |

**Rules**
- 3–5 chips. Labels ≤ 18 characters, verb-first.
- One row by default, horizontally scrollable with edge fades.
- At AX3+ it wraps to two rows (07 §3.2).
- Hide while the agent is working.
- Max one selected at a time; selection means the prompt was sent.

**A11y** — selected state announced. 44pt hit area via invisible inset.

---

## 4. Tool-status chip

The single most important trust element. It answers "what is it doing right now".

**Anatomy**

```
[glyph]  Checking calendar…          2 of 3
```

- Glyph 14pt, `text-tertiary`, becomes `danger` on fail.
- Label, Subhead, `text-secondary`.
- Optional counter, Footnote, `text-tertiary`, right-aligned.
- Optional elapsed time after 10s: `0:12`.

**States**

| State | Look | Exit |
|-------|------|------|
| Running | glyph + label, 1.2s cross-fade on step change | next step, or result |
| Queued | "2 of 3" counter visible | becomes running |
| Done | `checkmark` + "Done" for 1.2s | fades out |
| Failed | `danger` glyph + cause, tappable | opens log detail |
| Blocked | `warning` + "Waiting for you" | scrolls to approval |

**Copy**
- Present progressive, ≤ 3 words + `…` (U+2026).
- Verb the user understands: "Checking calendar…", "Drafting email…", "Posting to Slack…".
- Never: tool names, IDs, "Processing", "Thinking".

**Rules**
- Lives directly above the streaming reply, inside the agent block.
- One chip at a time. Steps replace; they do not stack.
- On failure it does not disappear. It becomes the error record.
- No spinner, no pulse. Cross-fade only.

**A11y** — polite live region. Announce on change, not on every tick.
Label: "Checking calendar". Failure: "Calendar check failed. Tap for details."

---

## 5. Message bubble

Rule: **user messages are bubbles. Agent messages are not.**

**User**
- Right-aligned, max 80% (560pt), `accent` fill, `accent-on`, Body.
- Radius `radius-md` with the bottom-right corner at `radius-sm`.
- No avatar, no name.

**Agent**
- Full content width, `canvas`, no fill, no border, `text-primary` Body.
- Prose, lists, tables, and cards allowed. This is why it is not a bubble.
- Group label "Assistant" appears once per group, Footnote `text-tertiary`, above the first message only.

**States**

| State | Look |
|-------|------|
| Sending | 70% opacity + `clock` glyph, ghost retry on tap |
| Sent | normal |
| Failed | `danger-tint` behind bubble + "Not sent · Tap to retry" |
| Streaming | 2pt caret after last glyph, fades `dur-2` |

**Spacing**
- Group gap `space-3`. Same-author gap `space-1`.
- User bubble padding 12×16. Min height 36.
- Long-press (iOS) / right-click (desktop): Copy, Share, "Explain this".

**Rules**
- Streaming never animates character-by-character.
- No read receipts. No typing dots for the user.
- Agent never claims to have done something the log does not show.
- Code blocks: `surface-sunken`, `radius-sm`, SF Mono 13 (12).

**A11y** — User message label "You said: …". Agent label "Assistant said: …". Streaming announces once on completion, not incrementally.

---

## 6. Approval card

The core of the product. Inline in chat, never a modal.

### 6.1 Anatomy

```
┌──────────────────────────────────────────┐
│ [icon] Send email           [Pending]    │  header
├──────────────────────────────────────────┤
│ To       anna@example.com                │
│ Subject  Running late                    │  preview
│ Body     Hey Anna, I'm running about…    │
├──────────────────────────────────────────┤
│ Sends immediately. Can't be recalled.    │  consequence
├──────────────────────────────────────────┤
│        Reject    Edit    [ Approve ]     │  actions
└──────────────────────────────────────────┘
```

- **Header** — 20pt tool glyph, action title Headline, status pill right.
- **Preview** — type-specific, label column 72pt `text-tertiary`, value `text-primary`. Max 4 rows, then "Show all".
- **Consequence** — one sentence, Footnote, `text-tertiary`. States what happens next and whether it can be undone. Required on every card.
- **Actions** — right-aligned. Order: Reject, Edit, Approve.

### 6.2 Preview by type

| Type | Rows |
|------|------|
| Email | To, Subject, Body (3 lines, clipped) |
| Calendar | Title, When, Where, Attendees (stacked avatars, +N) |
| Slack | Channel, Message |
| SMS | To, Message |
| Dashboard | Name, Sources, "12 items" |
| File/other | Name, Where, Size |

### 6.3 States

| State | Card | Actions |
|-------|------|---------|
| Proposed | skeleton rows, no buttons | none — "Preparing…" |
| Pending | full preview | Reject · Edit · Approve |
| Editing | fields are live inputs | Cancel · Approve edited |
| Approving | buttons locked, label `Approving…`; at 10s adds `Still working. Taking longer than usual.`; at 30s → Failed | none |
| Approved | collapses to one line | Undo (10s, reversible only) · View in activity |
| Rejected | collapses, 60% opacity, no tint | Ask again |
| Expired | collapses, `warning` icon, "Expired" | Ask again |
| Failed | stays open, `danger-tint`, cause line | Retry · Edit · Dismiss |

**Approved line**
```
[✓] Sent to Anna                     Undo
```
- Collapses `dur-2`. Height 44. Undo is Ghost, `accent`, expires at 10s.
- After 10s: Undo is removed, the row becomes a link to the log entry.
- **Undo rule** — appears only when the change stayed inside the user's account and nothing reached another person. Otherwise the row shows `View in activity` only.
- Undo reverts an effect. It never pretends to recall a message.

**Editing**
- Only preview values become editable. Consequence and header do not.
- Text fields keep their full value; no truncation while editing.
- "Approve edited" is primary. Edits are submitted with the approval, never separately.

### 6.4 Destructive variant
- Header gets `danger` glyph. Consequence line is `danger` text, not tertiary.
- Approve becomes Destructive. Label states the verb: "Delete 3 events".
- Requires an explicit sheet: title, item count, "This cannot be undone", Cancel + destructive confirm.
- No default focus on the destructive button. Esc / swipe dismisses.

### 6.5 Stacking
- Multiple pending: newest expanded, older ones collapse to a 44pt summary row.
- Tap a summary row to swap which is expanded. One expanded at a time.
- Never more than one scrollable card on screen.

### 6.6 Rules
- Never auto-dismiss a pending approval.
- Never preselect. No default button has focus on iOS.
- Expiry only when the underlying resource is gone (e.g. slot taken) — never a timer.
- Card never moves after Approve is tapped. Lock, then mutate in place.
- If the action is reversible, the consequence says so.
- `Approving…` shows no elapsed time and no progress bar. It gains one line at 10s, then times out at 30s.

**A11y**
- One container element: "Approval needed. Send email to Anna. Sends immediately and cannot be recalled."
- Buttons are separate elements. Actions rotor group named "Actions".
- After approving, announce "Approved. Sent to Anna. Undo available."
- Buttons stay ≥44×44 in Editing.

---

## 7. Composer

**Anatomy**

```
[ + ]  [ Ask or tell the agent…        ]  [mic] [↑]
```

- Field grows 1 → 5 lines, then scrolls.
- Left: attach (ghost, optional). Right: mic, then send.
- Send is `accent` fill circle 32, disabled at 0 characters → becomes mic only.
- Quick chips sit above the composer, not inside it.

**States**

| State | Behaviour |
|-------|-----------|
| Empty | Send hidden, mic shown |
| Typing | Send appears, mic stays |
| Recording | Field replaced by waveform + "Listening" + Cancel |
| Agent working | Still enabled. Send queues the message. |
| Offline | Field enabled, banner above, send queues |
| Auth expired | Field disabled, banner action = Reconnect |

**Rules**
- Placeholder: "Ask or tell the agent…". Never "Ask me anything".
- Return inserts a newline on iOS. Desktop: Enter sends, Shift+Enter newlines.
- Voice inserts text, it does not auto-send. User reviews, then sends.
- Bar is sticky, `surface`, 1pt top border, shadow-1 in light only.

---

## 8. Voice waveform

- 32 bars, 2pt wide, 2pt gap, height 4–24.
- Listening: `accent`, live level. Processing: static, `text-tertiary`.
- Timer right-aligned, tabular. Cancel is Ghost.
- Tap anywhere on the waveform to stop. 44pt target.
- Reduce Motion: static level bars.

---

## 9. Connection row

**Anatomy**
```
[icon 28]  Calendar                   [Connected]  >
           Read events · Create events
```

| Element | Spec |
|---|---|
| Icon | 28 (24), service mark, `radius-sm`, no brand-colour background |
| Name | Headline |
| Scope line | Footnote, `text-tertiary`, max 2 scopes then "+2 more" |
| Trailing | Connect (Primary sm) or Chevron when connected |
| Height | 64 (56) |

**States**

| State | Trailing | Scope line |
|-------|----------|------------|
| Disconnected | Connect | "Not connected" |
| Connecting | "Connecting…" locked | — |
| Connected | chevron | scopes |
| Expired | "Reconnect" (warning) | "Access expired" |
| Error | "Retry" (danger) | short cause |

**Rules**
- Connect is one tap. No OAuth explainer screen before the system sheet.
- Disconnect lives in the detail sheet, destructive, with a confirm.
- Permissions are listed in plain language, not scope strings.
- Brand marks appear only here. Never as page decoration.

**A11y** — one element: "Calendar, connected, can read events and create events. Double tap to manage."

---

## 10. Log entry

**Anatomy**

```
● 09:41  Sent email to Anna            [email]        Done
│        Delivered to anna@example.com
```

- Status glyph / dot 8pt on the timeline rail.
- Time, Footnote tabular, `text-tertiary`. Relative on iOS ("2m"), clock on desktop.
- Title, Subhead `text-primary`. Verb + object.
- Tool name, Micro, SF Mono, `text-tertiary`, in brackets.
- Result, Footnote, `text-secondary`, one line, clipped.
- Expand chevron → detail: parameters (secrets redacted), duration, request ID.

**States**

| State | Look |
|-------|------|
| Running | hollow dot + "Running…" |
| Done | `success` dot, normal |
| Failed | `danger-tint` row, `danger` dot, cause line, Retry ghost |
| Blocked | `warning` dot, "Waiting for approval" |
| Rejected | neutral dot, 60% opacity, "You rejected this" |

**Rules**
- Every action gets an entry, including rejected and expired. No silent actions.
- Failed rows are the only tinted rows. Nothing else competes.
- Never group or collapse entries by default.
- Day dividers: "Today", "Yesterday", then `d MMM`.

**A11y** — row reads: "9:41, Sent email to Anna, done. Email tool. Delivered to…". Failed rows announce "failed" before the cause.

---

## 11. Filter bar

- iOS: horizontal scroll chips, 36pt, one active at a time + "All".
- Desktop: chip group + a "Status" dropdown for compound filters.
- Shows counts: "Failed 2". Count is `text-tertiary`, never a badge.
- Sticky under the nav bar. `canvas` background, 1pt bottom border on scroll only.

---

## 12. Banner

**Anatomy** — glyph + title (Subhead) + one line + one action.

| Priority | Case | Style | Action |
|---|---|---|---|
| 1 | Auth expired | `warning-tint` | Reconnect |
| 2 | Offline | `surface-sunken` | Retry |
| 3 | Tool failed | `danger-tint` | Retry |
| 4 | Info | `accent-tint` | Dismiss |

**Rules**
- One banner at a time. Highest priority wins.
- Inline, above the content, never floating over it.
- Never auto-dismiss an error. Info may dismiss after 5s.
- Action is a Ghost button, right-aligned.

---

## 13. Empty state

- Glyph 48, `text-tertiary`, outline only.
- Title, Title 2. One line of copy, max 2 lines total, centred.
- 1–2 actions, Primary + Ghost. Never more.
- Vertically centred in the content area, 48pt below the nav bar minimum.

**Copy pattern**
- Title: what is missing. "No connections yet."
- Line: why it matters. "Connect a service so the agent can act."
- Action: the first step. "Connect Calendar"

---

## 14. Hard rules

1. One primary action per surface.
2. Approval card is never a modal on iOS.
3. Tool names never appear in user-facing copy, only in the log.
4. Every action is reversible, or says it is not.
5. No component may be identified by colour alone.
6. Loading never changes layout width or height.
7. No spinner component. The dashboard refresh glyph is the only rotating element, and only while refreshing.
