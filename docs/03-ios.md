# 03 — iOS Screens

iPhone, portrait primary. Light + dark. Dynamic Type to AX5.
Components from `02-components.md`. Tokens from `01-foundations.md`.

## Shell

**Tab bar** — 3 tabs, 49pt + safe area.

| Tab | Icon (SF Symbols) | Root |
|-----|-------------------|------|
| Chat | `bubble.left.and.text.bubble.right` | Last session |
| Activity | `list.bullet.rectangle` | Log |
| Settings | `gearshape` | Settings |

- Tab bar is translucent, `canvas` at 80% + blur, 1pt `border` on scroll.
- Each tab keeps its scroll position and navigation stack.
- Tapping an active tab scrolls to top, second tap returns to root.

**Nav bar**
- Large title collapses to inline on scroll.
- Background clear → `canvas` + 1pt bottom border once scrolled.
- Back is the system chevron. No custom back buttons.

**Presentations**
- Dashboard: full-screen cover with its own nav bar.
- Destructive confirm: sheet, medium detent, no scroll.
- Service detail, session detail: pushed.
- Model picker: sheet, medium detent.

```
Chat ──push──> Sessions ──push──> Session
  └──cover──> Dashboard
  └──sheet──> Destructive confirm
Settings ──push──> Connections ──sheet──> Service detail
Activity ──push──> Action detail
```

---

# Screen 1 — Chat

## Purpose
One place to ask, watch, and approve. Default surface of the app.

## Layout

```
┌──────────────────────────────────────┐
│ ☰  Weekly spending            ✎      │  nav
├──────────────────────────────────────┤
│                                      │
│  Assistant                           │
│  Your week is up 12% on dining.      │
│  ┌────────────────────────────────┐  │
│  │ Spending · 7 days     Open  ›  │  │  dashboard card
│  └────────────────────────────────┘  │
│  ✓ Created dashboard                 │
│                                      │
│  ⟳ Checking calendar…        2 of 3  │  tool status
│  Friday 1pm is free. Want me to…     │  streaming
│                                      │
│  ┌ Approval ─────────────── Pending┐ │
│  │ Create event                   │ │
│  │ …                              │ │
│  └────────────────────────────────┘ │
│                                      │
│                    ┌───────────────┐ │
│                    │ lunch Friday  │ │  user
│                    └───────────────┘ │
├──────────────────────────────────────┤
│ [New event] [Send message] [Dash…]   │  chips
│ +  Ask or tell the agent…   🎙  ↑    │  composer
└──────────────────────────────────────┘
```

## Anatomy

1. **Nav bar** — `☰` pushes Sessions · title is the session name · `✎` starts a new session.
2. **Stream** — top-aligned list, anchored to bottom. Group gap `space-3`.
3. **Agent group label** — "Assistant", Footnote, `text-tertiary`. First message of a group only.
4. **Reply** — full-width prose. May contain tables, lists, cards.
5. **Dashboard card** — 72pt summary row: name, period, item count, chevron. Opens the cover.
6. **Tool-status chip** — one at a time, directly above the reply it belongs to.
7. **Action cards** — inline, in stream order. See Screen 2.
8. **User bubble** — right-aligned, accent.
9. **Quick chips** — above the composer, hidden while working or recording.
10. **Composer** — sticky, 1pt top border, shadow-1 in light only.
11. **Jump-to-latest** — 40pt pill, bottom-centre above chips, appears only when scrolled up more than one screen.

## States

| State | Screen |
|-------|--------|
| Empty — first launch, no connections | Glyph + "Your assistant is ready." + "Connect a service so it can act." Primary "Connect Calendar", Ghost "Just chat". Below: 3 example prompts as ghost rows. |
| Empty — new session | No copy. Chips + 3 example prompts: "Create a dashboard of my weekly spending", "Message Anna that I'm running late", "Schedule lunch Friday at 1pm". |
| Loading | Reply skeleton: 3 lines at 60% width, `surface-sunken`, no shimmer |
| Streaming | Tool chip above, caret at the end of text, composer active |
| Long-running (>10s) | Chip gains elapsed `0:12`; 2pt indeterminate bar under nav; auto-scroll stops; "Task finished" push if backgrounded |
| Error — tool | Chip turns `danger`, "Couldn't read your calendar. Tap for details." Retry ghost. Chat stays usable. |
| Error — offline | Banner above chips: "You're offline. Messages will send when you reconnect." Queued bubbles at 70% |
| Error — auth expired | Banner: "Calendar access expired." Reconnect. Action disabled until resolved. |
| Approval pending | Card inline, full. Not blocking. No auto-scroll after the first reveal. |
| Approved | Card collapses to one line + Undo |
| Rejected | Card collapses, muted, "Ask again" |
| Destructive | Card + confirm sheet. See Screen 2. |

## Copy

| Slot | Text |
|------|------|
| Placeholder | "Ask or tell the agent…" |
| Chips | New event · Send message · Dashboard · Check calendar · Summarise |
| Working | "Checking calendar…" · "Drafting email…" · "Reading messages…" |
| Done | "Done" |
| Queued | "Sending when you're back online" |
| Thinking (banned) | Never "Thinking", "Processing", "Working on it" |

## Accessibility

- Stream is a list. New messages announce once, on completion.
- Streaming text does not move focus. Announce after the reply settles.
- Tool chip is a polite live region; throttle to one announcement per step.
- Jump-to-latest announces "New messages".
- Composer: label "Message the assistant", trait `textField`, hint "Type or dictate a request".
- Mic: label "Dictate a message". Send: "Send message".
- AX3+: chips wrap to two rows; chat bottom padding grows to keep the last card above the composer.

## Edge cases

- 320pt width: consequence line wraps to 2 lines; buttons stay on one row.
- Keyboard up: chips hide, stream scrolls, last message stays visible.
- Rotate: chat stays portrait; only Dashboard and push rotate.
- Message sent while scrolled up: do not yank to bottom. Show jump pill.
- Agent is interrupted mid-stream (app killed): on relaunch the message shows "Stopped" + Retry.
- Very long single message: no max height, it scrolls. Code blocks scroll horizontally, never wrap.
- 50+ messages: virtualise. Keep 200 in memory.

---

# Screen 2 — Approval (inline)

## Purpose
Turn a proposal into a decision in one tap, with enough context to judge it.

## Layout

Card sits where the agent proposed it. It never jumps to the top of the chat.
On arrival, scroll once to reveal it fully. Never again.

```
┌────────────────────────────────────────┐
│ ✉  Send email              [Pending]   │
├────────────────────────────────────────┤
│ To       anna@example.com              │
│ Subject  Running late                  │
│ Body     Hey Anna, running about 15…   │
├────────────────────────────────────────┤
│ Sends immediately. Can't be recalled.  │
├────────────────────────────────────────┤
│        Reject    Edit    [ Approve ]   │
└────────────────────────────────────────┘
```

## Anatomy

1. **Header** — 20pt glyph, action title, status pill.
2. **Preview** — 2–4 rows, label column 72pt. Values are the real payload, not a summary.
3. **Consequence** — one sentence. Always present. States effect + reversibility.
4. **Actions** — Reject · Edit · Approve, right-aligned, 44pt.
5. **Edit mode** — preview values become fields. Buttons → Cancel · Approve edited.
6. **Confirmed state** — 44pt collapsed row.

### Worked examples

**Email**
```
To       anna@example.com
Subject  Running late
Body     Hey Anna, running about 15 minutes behind. Start without me.
```
> Sends immediately. Can't be recalled.

**Calendar**
```
Title     Lunch with Anna
When      Fri 14 Nov, 1:00–2:00 pm
Where     Café Nero, Kings Cross
Guests    Anna Nowak, +1
```
> Sends invites to 2 people. Can't be undone.

**SMS**
```
To       +48 601 234 567
Message  Running 15 min late, see you soon.
```
> Sends from your number. Can't be recalled.

## States

| State | Render |
|-------|--------|
| Proposed | Skeleton rows, no buttons, "Preparing…" |
| Pending | Full card |
| Editing | Fields live, keyboard up, Cancel · Approve edited |
| Approving | Buttons locked, label `Approving…`. At 10s: `Still working. Taking longer than usual.` At 30s: Failed, `Timed out after 30s`. |
| Approved | Collapse to `✓ Sent to Anna`. Undo only if reversible. |
| Rejected | Collapse, 60%, no tint, "Ask again" ghost |
| Expired | Collapse, `warning`, "Expired — that slot was taken", "Ask again" |
| Failed | Stays open, `danger-tint`, cause + Retry · Edit · Dismiss |

Sends and events with guests are irreversible. No Undo — the row links to the log.
Solo events and dashboards keep Undo: they never leave the account.

## Destructive flow

```
① Card, destructive variant     ② Sheet
✕ Delete 3 events               Delete 3 events?
Sends cancellations to 5       • Mon 10:00 Standup
people. Can't be undone.       • Wed 10:00 Standup
[ Cancel ] [Delete 3 events]   • Fri 10:00 Standup
                               This can't be undone.
                               [ Cancel ]  [ Delete 3 events ]
```
- Sheet: medium detent, no drag-to-dismiss for destructive.
- Cancel is primary-styled here. Destructive is filled red, right.
- No default focus. Esc dismisses on desktop only.

## Copy

| Slot | Rule |
|------|------|
| Title | Imperative verb + object. "Send email", "Create event", "Delete 3 events" |
| Consequence | Effect, then reversibility. End with a period. |
| Approve | Generic "Approve" — except destructive, which names the verb |
| Edit | Always "Edit" |
| Reject | Always "Reject" |
| After approve | Past tense + recipient. "Sent to Anna" |

## Accessibility

- Card is one element. Label: action, key values, consequence.
- Then 3 buttons in order. Rotor action "Actions".
- Announcement on appear: "Approval needed. Send email to Anna."
- Announcement after approve: "Approved. Sent to Anna. Undo available for 10 seconds."
- Editing: fields announced with their preview label, not placeholder.
- 44×44 minimum in both rows. Never less, even at AX5.
- Arrival is a polite announcement. It never moves focus, and waits for active dictation to end.
- Undo is a VoiceOver custom action on the collapsed row for its 10s.

## Edge cases

- Two pending: newest expanded, older collapsed to 44pt summary rows. Tap to swap.
- Approved from a push while chat is elsewhere: card is already collapsed when you arrive.
- Undo while offline: allowed, queues. Consequence becomes "Will undo when back online".
- Approval expires while backgrounded: on return, card is collapsed and muted; no announcement.
- User types a new message while a card is pending: card stays; it is not dismissed.
- Agent retries a failed action: new card, new timestamp. Old one stays as a failed record.

---

# Screen 3 — Dashboard viewer

## Purpose
See what the agent built, at full size, and change it by asking.

## Layout

```
┌──────────────────────────────────────┐
│ ✕   Weekly spending      ⇪  ⟳  ⋯     │
├──────────────────────────────────────┤
│ 1–7 Nov · 38 receipts · Updated 2m ago│
│                                      │
│ ┌────────┐ ┌────────┐ ┌────────┐     │
│ │ €412   │ │ €58/day│ │ +12%   │     │  KPIs (scroll)
│ └────────┘ └────────┘ └────────┘     │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ By category                    │   │
│ │ ▇▇▇▇▇ Dining        €128       │   │
│ │ ▇▇▇ Groceries       €96        │   │
│ └────────────────────────────────┘   │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ Daily spend                    │   │
│ │      ╱╲    ╱╲                  │   │
│ └────────────────────────────────┘   │
├──────────────────────────────────────┤
│      ✎  Ask the agent to change this │  sticky footer
└──────────────────────────────────────┘
```

## Anatomy

1. **Nav bar** — `✕` closes · title = dashboard name · `⇪` share · `⟳` refresh · `⋯` menu.
2. **Meta row** — period, data source, "Updated 2m ago". Footnote, `text-tertiary`.
3. **KPI row** — horizontal scroll, 2.4 cards visible. Value 28pt semibold, tabular.
4. **Chart cards** — `surface`, `radius-md`, 16 padding, title Headline. Max 4 per dashboard; overflow scrolls.
5. **Table card** — optional, last. Rows 44pt, alternating none, 1pt dividers.
6. **Footer** — sticky, `surface`, 1pt top border. Primary ghost with pencil.

### Menu (`⋯`)
Rename · Duplicate · Export data (CSV) · Delete dashboard (destructive).

## States

| State | Render |
|-------|--------|
| Loading | Nav visible, 3 KPI skeletons + 2 card skeletons, no spinner |
| Empty | "No spending in this period." + "Ask to change the date range" |
| Refreshing | Small `⟳` spins in place, content stays, 40% dim on cards |
| Stale (>24h) | Meta row turns `warning` icon: "Updated yesterday" + Refresh |
| Error | Card-level: "Couldn't load this chart." Retry per card, rest renders |
| Full failure | "This dashboard didn't load." Retry · Ask to rebuild |
| Offline | Cached render + banner "Showing saved data from 2h ago" |
| Regenerating | Nav subtitle = tool-status chip "Rebuilding…" |

## Copy

| Slot | Text |
|------|------|
| Footer | "Ask the agent to change this" |
| Empty | "No spending in this period." |
| Stale | "Updated yesterday" |
| Share sheet | "Share snapshot" |

## Accessibility

- Charts MUST expose a text summary: "Dining €128, 31% of spend, up 12%."
- Every chart has a table alternative via the rotor, not a separate screen.
- KPI cards read: "Total spend, 412 euro, up 12 percent from last week."
- Chart colours never carry meaning alone — series are labelled.
- Landscape supported. Portrait pays for itself; landscape is a bonus.

## Edge cases

- Zero rows after a valid query: empty state, not an error.
- One data point: draw the bar, skip the trend line.
- Huge numbers: abbreviate at 6 digits (€1.2M), full value on tap.
- 12+ categories: top 5 + "Other".
- Dashboard deleted while open: close with a toast "Dashboard deleted" + Undo (10s).
- Refresh fails but cache is valid: keep cache, show inline warning on the meta row only.

---

# Screen 4 — Activity log

## Purpose
Every action the agent took, in order, with outcome. The trust ledger.

## Layout

```
┌──────────────────────────────────────┐
│  Activity                            │  large title
│  🔍 Search                           │
│ [All 42] [Sent 18] [Failed 2] [Wait] │
├──────────────────────────────────────┤
│ Today                                │
│ ● 09:41  Sent email to Anna    Done  │
│ │        Delivered · email           │
│ ● 09:38  Created dashboard     Done  │
│ │        Weekly spending · 12 items  │
│ ● 09:30  Read calendar         Done  │
│ │        ical · 14 events            │
│ Yesterday                            │
│ ✕ 18:02  Posted to #general    Failed│
│ │        Slack rejected the message  │
│ │        Retry                       │
└──────────────────────────────────────┘
```

## Anatomy

1. **Large title** — "Activity".
2. **Search** — collapsed to icon until pulled down; matches action titles and results.
3. **Filter bar** — All · Sent · Created · Read · Failed · Waiting. One active. Counts shown.
4. **Day dividers** — sticky, `surface`, Subhead.
5. **Timeline rail** — 1pt `border`, 8pt dot per entry, continuous through a day.
6. **Entry** — glyph, time, title, tool, result. See components.
7. **Failed entry** — `danger-tint`, cause, Retry ghost.
8. **Detail push** — full record.

### Action detail
```
Status      Failed
Action      Posted to #general
Tool        slack.post_message
Time        18:02:14 · 412ms
Session     Weekly updates  ›
Result      channel_not_found
```
Plus: Retry · Copy request ID · View in chat.
Secrets are redacted as `••••`. Always.

## States

| State | Render |
|-------|--------|
| Empty | "No activity yet." "Actions will appear here as the agent works." |
| Loading | 6 skeleton rows, no spinner |
| Filtered empty | "No failed actions." + Clear filter |
| Long list | Infinite scroll, 50/page, divider stays sticky |
| Failed present | Only tinted rows in the list. Nothing else uses `danger-tint`. |
| Offline | Cached entries + banner. Retry disabled. |

## Copy

| Slot | Text |
|------|------|
| Filter | All · Sent · Created · Read · Failed · Waiting |
| Failed | Cause in plain language, then Retry |
| Empty | "No activity yet." |
| Timeout | "Timed out after 30s" |

## Accessibility

- Row is one element: time, action, status, tool, result.
- Failed rows announce "failed" before the cause.
- Day dividers are headings; the list is a collection with 42 entries announced.
- Timeline rail is decorative, `accessibilityElementsHidden`.

## Edge cases

- 1,000+ entries: virtualise by day, keep 3 days mounted.
- Timezone change: times re-render in device timezone; detail shows absolute time.
- Pending approval renders as "Waiting for approval" and links to the card.
- Rejected actions appear here too, at 60% opacity.
- Pull-to-refresh forces a sync; it does not re-run actions.

---

# Screen 5 — Connections

## Purpose
See what the agent can touch, and change it.

## Layout

```
┌──────────────────────────────────────┐
│ ‹ Settings                           │
│  Connections                         │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 📅 Calendar          [Connected]›│ │
│ │ Read events · Create events      │ │
│ ├──────────────────────────────────┤ │
│ │ ✉  Email                          │ │
│ │ Not connected        [ Connect ] │ │
│ ├──────────────────────────────────┤ │
│ │ 💬 Slack             ⚠ Reconnect │ │
│ │ Access expired                   │ │
│ ├──────────────────────────────────┤ │
│ │ ✆  SMS               [Connected]›│ │
│ │ Send messages                    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Permissions are checked before every │
│ action. You can change these anytime.│
└──────────────────────────────────────┘
```

## Anatomy

1. **Nav** — pushed from Settings. Title "Connections".
2. **Service list** — one grouped card, 1pt separators inset 16.
3. **Row** — 64pt, icon 28, name, scope line, trailing action.
4. **Footer note** — Footnote, `text-tertiary`, 16 padding.
5. **Detail sheet** — medium detent, scrollable if scopes exceed 6.

### Detail sheet
```
📅 Calendar                    Connected
Connected since 3 Nov
────────────────────────────────────
Can do
✓ Read your events
✓ Create and edit events
✓ See attendees
────────────────────────────────────
Disconnect
```

## States

| State | Render |
|-------|--------|
| Empty (first launch) | "No services connected." + Connect Calendar (primary) |
| Connected | Status pill + chevron |
| Disconnected | Connect, primary small |
| Connecting | "Connecting…" locked, row at 70% |
| Expired | `warning` label + Reconnect |
| Error | `danger` cause + Retry |
| Disconnecting | Sheet dismisses, row shows "Disconnecting…" |
| Cancelled OAuth | Row returns to previous state. No error shown. |

## Copy

| Slot | Text |
|------|------|
| Connect | "Connect" |
| Reconnect | "Reconnect" |
| Scopes | "Read your calendar events", "Send email as you", "Post as you" |
| Disconnect confirm | "Disconnect Calendar? The agent will stop using it immediately." |
| Footer | "Permissions are checked before every action." |

## Accessibility

- Row is one element: service, state, scopes, action.
- Connect is a 44pt button inside the row, not the whole row.
- Status is announced as a word, not a colour.
- Detail sheet has a heading trait on the service name.

## Edge cases

- Revoked in the OS while app is open: on next foreground, row flips to Expired. No modal.
- Partial scopes (user grants some): row shows only granted scopes + "Some permissions missing".
- Account switch: all rows reset to Disconnected, one banner explains.
- Disconnect with a pending approval on that service: confirm copy adds "1 pending action will be cancelled."

---

# Screen 6 — Sessions

## Purpose
Find and reopen past conversations.

## Layout

```
┌──────────────────────────────────────┐
│ ‹ Weekly spending                    │
│  Sessions                            │
│  🔍 Search                           │
├──────────────────────────────────────┤
│ Today                                │
│  Weekly spending                     │
│  Your week is up 12% on dining…      │
│                              09:41 ● │
│  Lunch with Anna                     │
│  Schedule lunch Friday at 1pm        │
│                              08:12 ● │
│ Yesterday                            │
│  Standup notes                       │
│  Summarise the standup thread        │
│                              18:02   │
└──────────────────────────────────────┘
```

## Anatomy

1. **Nav** — pushed from Chat. Back returns to the current session.
2. **Search** — always visible, pinned under the title.
3. **Groups** — Today · Yesterday · Previous 7 days · Previous 30 days · Older.
4. **Row** — 72pt: title (Headline, 1 line), snippet (Footnote, 1 line), time, status dot.
5. **Status dot** — `warning` when a pending approval exists, `danger` when the last action failed, none otherwise.
6. **Swipe** — Delete only. Long-press: Rename, Delete.

## States

| State | Render |
|-------|--------|
| Empty | "No conversations yet." + "Start a chat" |
| No results | "Nothing matches "calendar"." + Clear search |
| Loading | 8 skeleton rows |
| Many | Infinite scroll, grouped headers sticky |

## Copy

| Slot | Text |
|------|------|
| Auto title | First user message, ≤ 40 chars, no trailing punctuation |
| Untitled | "New session" |
| Delete confirm | "Delete this conversation? Its activity history stays." |

## Accessibility

- Row label: title, snippet, time, and "needs approval" when flagged.
- Search field: label "Search conversations".
- Group headers: heading trait, announce count.

## Edge cases

- Session with a pending approval: dot + confirm on delete warns "1 action is waiting for you."
- Search covers message text, not just titles.
- 500+ sessions: load 30 per page, keep scroll position on return.
- Renaming persists; auto-title never overwrites a manual name.

---

# Screen 7 — Settings

## Purpose
Control the agent's model, its notifications, and when it must ask.

## Layout

```
┌──────────────────────────────────────┐
│  Settings                            │
├──────────────────────────────────────┤
│ AGENT                                │
│  Model                    Balanced › │
│  Approval rules                      │
│  ┌────────┬──────────┬────────────┐  │
│  │ Always │ Sending  │ Read-only  │  │
│  │  ask   │ only     │ never ask  │  │
│  └────────┴──────────┴────────────┘  │
│  Asks before anything that sends or  │
│  changes data.                       │
│                                      │
│ NOTIFICATIONS                        │
│  Task finished                [ ●]   │
│  Approval needed              [ ●]   │
│  Failures                     [ ●]   │
│                                      │
│ CONNECTIONS                          │
│  Calendar, Email, Slack, SMS       › │
│                                      │
│ DATA                                 │
│  Keep activity for            90 days│
│  Delete all activity                 │
└──────────────────────────────────────┘
```

## Anatomy

1. **Grouped inset list.** Section header: Footnote, `text-tertiary`, sentence case, 8pt above.
2. **Model row** — current name + chevron. Opens a sheet.
3. **Approval rules** — 3-segment control + one-line explainer that changes with selection.
4. **Toggles** — system switches, `accent` on.
5. **Connections** — summary row pushes Screen 5.
6. **Data** — retention picker, destructive delete.
7. **About** — version, privacy, sign out. Pushed, not shown above.

### Model sheet
```
Model
● Balanced        Best for most tasks
○ Fast            Quicker, less thorough
○ Thorough        Slower, most capable
Auto is recommended. Changes apply to
new messages.
```

### Approval rules copy

| Option | Explainer |
|--------|-----------|
| Always ask | Asks before every action that changes something. |
| Sending only | Asks before sending messages or deleting. Read-only runs freely. |
| Read-only never ask | Reads run freely. Everything else still asks. |

## States

| State | Render |
|-------|--------|
| Default | As shown |
| Loading models | Sheet with 3 skeleton rows |
| Model load error | "Couldn't load models." Retry |
| Never-ask warning | Banner under the segment: "Actions will run without confirmation." `warning-tint` |
| Delete activity | Sheet confirm: "Delete all activity? This clears the log. It can't be undone." |
| Saving | Row shows "Saving…" inline, 1s max |

## Accessibility

- Segmented control: label "Approval rules", each segment a radio with the explainer as hint.
- Toggles: label only, no redundant "on/off" in the label.
- Destructive rows use `danger` text, not a red background.
- Section headers are headings so VoiceOver can jump by section.

## Edge cases

- Policy is server-enforced. The client reflects it; it does not enforce it.
- "Never ask" + destructive action: destructive still asks. Never override that.
- Sign out with a pending approval: warn "1 action is waiting for you."
- Offline: settings read from cache, writes queue, rows show "Saving…" until confirmed.

---

# Screen 8 — Push and lock screen

## Purpose
Tell the user the two things that matter, and let them act without unlocking the app.

## Layout — lock screen

```
┌──────────────────────────────────────┐
│            Monday 9 November         │
│                09:41                 │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ASSISTANT              now       │ │
│ │ Approval needed                  │ │
│ │ Send email to Anna — Running late│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ASSISTANT              2m ago    │ │
│ │ Dashboard ready                  │ │
│ │ Weekly spending · 12 categories  │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Notification A — Approval needed

| Field | Value |
|-------|-------|
| Title | Approval needed |
| Body | `Send email to Anna — Running late` |
| Thread | Session name |
| Sound | Default |
| Actions | Approve · Edit · Reject |

- **Approve** — `authenticationRequired`. Face ID, then executes. On success the notification clears and a replacement fires: "Sent to Anna".
- **Edit** — opens the app directly to the card, focused.
- **Reject** — no auth needed. Executes immediately, notification clears.
- **Tap** — opens the session, scrolled to the card.

## Notification B — Task finished

| Field | Value |
|-------|-------|
| Title | Dashboard ready / Lunch scheduled / Email sent |
| Body | Concrete result: `Weekly spending · 12 categories` |
| Actions | View · (Undo if reversible) |

- Title is the outcome, never "Task complete".
- Body is the object, never a repeat of the title.
- No summary notification for multi-step work. One per session, coalesced.

## Layout — expanded / grouped
- 3+ from one session collapse into one group with "3 updates".
- Group title = session name.
- Approval notifications never group with finished notifications.

## Live Activity (long-running)
- Lock screen + Dynamic Island: `⟳ Checking calendar… 0:12`
- Tap → opens the session at the tool chip.
- Ends on completion, then transitions to notification B after 3s if the app is backgrounded.

## States

| State | Render |
|-------|--------|
| Default | As shown |
| Expanded | Body up to 4 lines + full actions |
| Approved from lock | "Sent to Anna" |
| Expired | Notification clears; on tap app shows "Expired" card |
| Auth failed | Nothing executes. Notification stays. No error copy on lock screen. |
| Multiple pending | Separate notifications, oldest at bottom |
| DND / Focus | Delivered silently; approval still requires opening the app |

## Copy

| Slot | Text |
|------|------|
| Approval title | "Approval needed" |
| Approval body | `{Verb} {object} — {key detail}` |
| Done title | The outcome. "Email sent", "Lunch scheduled", "Dashboard ready" |
| Done body | The object + the one number that matters |
| Banned | "Task complete", "I've finished", "Your assistant has…" |

## Accessibility

- Notification actions must be ≥44pt tall.
- VoiceOver reads title, body, then actions in order.
- Never rely on the app icon or colour to convey type; the title carries it.
- Haptics: success notification = `.success`, approval = `.warning`. Not decorative.

## Edge cases

- Approve from lock screen with the app killed: cold launch, deep-link to the card, show the confirmed state. No flash of the pending card.
- Action already expired when tapped: execute fails, open the card with "Expired".
- Two approvals in the same second: queue, one notification at a time, 1s apart.
- Undo from a notification while offline: queues, notification updates to "Will undo when online".
- User disables notifications: in-app approvals still work. Never block on push.
