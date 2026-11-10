# 07 — Accessibility

Baseline: WCAG 2.2 AA on both clients, plus the platform APIs users already rely on.
Every rule here is checkable without reading source.
## 1. Standard and scope
| Layer | Applies to | Requirement |
|-------|-----------|-------------|
| WCAG 2.2 AA | iOS, macOS, Windows | Every criterion in §1.1, light and dark |
| iOS | iPhone | VoiceOver, Dynamic Type to AX5, Reduce Motion, Increase Contrast, Bold Text, Button Shapes, Full Keyboard Access, Switch Control, Voice Control |
| Desktop | macOS, Windows 11 | VoiceOver, Narrator, NVDA, Reduce Motion, Increase Contrast, Full Keyboard Access, text scale 100–200% |
| Notifications | push, toasts | OS renders; the app supplies names, actions, and order only |
### 1.1 Criteria that apply
| Criterion | Level | Where it bites |
|-----------|-------|----------------|
| 1.3.1 Info and relationships | A | Stream order, headings, chart tables |
| 1.4.3 Contrast | AA | Every text pair in §2 |
| 1.4.4 Resize text | AA | AX5, desktop 200% |
| 1.4.11 Non-text contrast | AA | Focus ring, buttons, chart lines, input edges |
| 2.1.1 Keyboard | A | All desktop; iOS with a hardware keyboard |
| 2.2.1 Timing adjustable | A | Undo window, approval tokens |
| 2.3.3 Animation from interactions | AAA, adopted | §7 |
| 2.4.3 and 2.4.7 | A, AA | Focus order and visibility, §5 |
| 2.4.11 Focus not obscured | AA | Sticky composer, software keyboard |
| 2.5.5 Target size | AAA, adopted | 44pt iOS floor, §6 |
| 2.5.7 Dragging movements | AA | Swipe delete, splitters |
| 3.3.1 and 3.3.3 | A, AA | Error formula, §10 |
| 4.1.2 Name, role, value | A | §4 |
| 4.1.3 Status messages | AA | Tool chip, approvals, undo |

Out of scope: iPad layout, web, Android (see `00-overview.md`).
Test targets: VoiceOver on current iOS and macOS, Narrator and NVDA on Windows 11.
### 1.2 Precedence
- 01 owns tokens, 02 owns components, 03/04 own screens. This doc owns pass criteria.
- A component a11y rule in 02 is extended here, never replaced.
- Where a screen doc and this contract disagree, this contract states the fix and the screen doc is patched.
## 2. Contrast

sRGB relative luminance, WCAG 2.2 formula, to 1 decimal.
Where 01 states a ratio, that value is kept; recomputation agrees within 0.1.
No pair relies on the large-text exception. `border` dividers are exempt: they are not controls.
### 2.1 Text
| Pair | Light | Dark | Req | Result |
|------|-------|------|-----|--------|
| `text-primary` on `canvas` | 16.5 | 17.4 | 4.5 | Pass |
| `text-primary` on `surface` | 15.6 | 16.1 | 4.5 | Pass |
| `text-primary` on `surface-raised` | 16.5 | 14.8 | 4.5 | Pass |
| `text-primary` on `surface-sunken` | 14.6 | 17.9 | 4.5 | Pass |
| `text-secondary` on `canvas` | 8.0 | 11.5 | 4.5 | Pass |
| `text-secondary` on `surface` | 7.5 | 10.7 | 4.5 | Pass |
| `text-tertiary` on `canvas` | 4.9 | 7.5 | 4.5 | Pass |
| `text-tertiary` on `surface` | 4.5 | 7.0 | 4.5 | Pass, no margin |
| `text-tertiary` on `surface-raised` | 4.9 | 6.4 | 4.5 | Pass |
| `text-tertiary` on `surface-sunken` | 4.2 | 7.7 | 4.5 | **Fail, light** |
| `accent` on `canvas` | 5.8 | 7.2 | 4.5 | Pass |
| `accent` on `surface` | 5.5 | 6.7 | 4.5 | Pass |
| `accent` on `accent-tint` | 5.1 | 5.8 | 4.5 | Pass |
| `accent-on` on `accent` | 5.8 | 7.2 | 4.5 | Pass |
| `success` on `canvas` | 5.0 | 9.9 | 4.5 | Pass |
| `warning` on `canvas` | 5.9 | 10.5 | 4.5 | Pass |
| `danger` on `canvas` | 6.5 | 8.4 | 4.5 | Pass |
| `text-inverse` on `danger` | 6.5 | 8.4 | 4.5 | Pass |

All dark text tiers clear 4.5:1, and clear 7:1 on `canvas`.
### 2.2 Text on tints

Tint is 10% alpha over the surface behind it. Worst case is `surface`, not `canvas`.

| Pair | Light | Dark | Req | Result |
|------|-------|------|-----|--------|
| `success` on `success-tint` over `surface` | 4.2 | 7.7 | 4.5 | **Fail, light** |
| `success` on `success-tint` over `canvas` | 4.4 | 8.5 | 4.5 | **Fail, light** |
| `warning` on `warning-tint` | 4.9 | 8.1 | 4.5 | Pass |
| `danger` on `danger-tint` | 5.2 | 6.7 | 4.5 | Pass |
### 2.3 Non-text
| Pair | Light | Dark | Req | Result |
|------|-------|------|-----|--------|
| `accent` focus ring on `canvas` | 5.8 | 7.2 | 3.0 | Pass |
| `border-strong` input edge on `canvas` | 3.7 | 3.3 | 3.0 | Pass |
### 2.4 Fixes, existing tokens only
- Status pill: the label becomes `text-primary`, the 12pt glyph keeps `success`. The word still carries the state.
- Placeholders on `surface-sunken` use `text-secondary` (7.1), never `text-tertiary`.
- Inputs keep a visible label and the 2px `accent` ring. The border is a redundant third cue.
- Increase Contrast mode strengthens edges to `text-tertiary` and drops tints (04 §12).
## 3. Dynamic Type and text scaling
### 3.1 iOS

System text styles only. Multipliers are approximate; never hard-code a point size.

| Size | Body | Multiplier | Consequence |
|------|------|-----------|-------------|
| Default | 17 | 1.0 | Reference layout |
| AX1 | 28 | 1.6 | Approval actions stay inline |
| AX2 | 33 | 1.9 | Nav title collapses to inline |
| AX3 | 40 | 2.3 | Approval actions stack; chips wrap |
| AX4 | 47 | 2.8 | Connection action moves under its text |
| AX5 | 53 | 3.1 | One column; no side-by-side controls |
### 3.2 Per-component reflow
| Component | AX1–AX2 | AX3–AX4 | AX5 |
|-----------|---------|---------|-----|
| Message bubble | 80% cap | 85% | Full width minus 16 |
| Approval card | Actions inline, 44pt | Stacked, full width | Stacked, 44pt, 8pt gap |
| Status pill | Glyph + word | Word only | Word only, 2 lines |
| Tool-status chip | One line, counter right | Counter under label | 3 lines max |
| Quick-action chip | Horizontal scroll | Wrap to 2 rows | Wrap to 3 rows |
| Composer | 1–5 lines | 1–6 lines | 96pt bottom padding |
| Log entry | Time leading | Time above title | Time, title, result stacked |
| Connection row | 64pt fixed | Intrinsic height | Action under text |
| Session row | 72pt fixed | Title 2 lines | Title 3 lines, snippet 2 |
| Chart card | Chart + summary | Summary 2 lines | Table replaces chart |

- Chips stay on one row by default and wrap at AX3+. Horizontal scroll fails above AX2.
- Width and text size are separate axes. At 320pt plus AX5, text size wins and the card stacks.
### 3.3 Desktop
| Scale | Body | Consequence |
|-------|------|-------------|
| 100% | 15 | Three panes |
| 125% | 19 | Chat stays 720 wide, text reflows |
| 150% | 23 | Right panel overlays below 1200 |
| 175% | 26 | Activity drops the Tool column into detail |
| 200% | 30 | Sidebar overlays, one pane at a time |

- Never scroll horizontally (04 §11). Panes reflow, text never clips.
- No ellipsis on body copy. No shrink-to-fit. Never reduce a 44pt target to make text fit.
- Never clip an approval value; wrap it, then offer "Show all".
## 4. VoiceOver

Source order is reading order and equals the order below.
Labels are final strings. Implement them verbatim. A dash in Hint means no hint.
No surface auto-focuses on arrival. Announcements are polite unless stated.
### Chat
Order: nav → group label → tool status → reply → dashboard card → approval → user → chips → composer.

| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Nav, leading | "Sessions" | "Shows all conversations" | Button |
| Agent message | "Assistant said: Your week is up 12 percent on dining." | — | Static text |
| Dashboard card | "Weekly spending. 7 days. 12 items." | "Opens the dashboard" | Button |
| Tool status | "Checking calendar. Step 2 of 3." | — | Static text |
| Composer | "Message the assistant" | "Type or dictate a request" | Text field |

- The tool chip is a polite live region: one announcement per step, never per tick.
- Replies announce once, on completion. Streaming never moves focus.
### Approval
Announce once on appear: "Approval needed. Send email to Anna."
Announce after approve: "Approved. Sent to Anna. Undo available for 10 seconds."
No auto-focus. Focus stays where the user left it.

| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Card, one element | "Approval needed. Send email to Anna. Subject, Running late. Sends immediately and cannot be recalled." | — | Static text |
| Reject | "Reject" | "Declines this action. Nothing is sent." | Button |
| Edit | "Edit" | "Opens the fields for this action" | Button |
| Approve | "Approve" | "Sends the email now. Cannot be recalled." | Button |
| Undo | "Undo" | "Reverses the action. Available for 10 seconds." | Button |
| Approve edited | "Approve edited" | "Sends with your changes" | Button |

- One container, then three buttons. Rotor group is named "Actions".
- Consequence and preview live inside the container label, never as separate stops.
- Undo stays in the Actions rotor for 10s, reachable without sight of the collapsed row.
- Destructive confirm reads "Delete 3 events. Cannot be undone." Cancel comes first.
### Dashboard
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Close | "Close dashboard" | "Returns to the conversation" | Button |
| KPI | "Total spend, 412 euro, up 12 percent from last week." | — | Static text |
| Chart | "By category. Dining, 128 euro, 31 percent of spend, up 12 percent." | "Table alternative in the rotor" | Static text |
| Footer | "Ask the agent to change this dashboard" | "Opens the message field" | Button |

- Share is "Share dashboard". Refresh is "Refresh dashboard". Each chart exposes a real table in the rotor.
### Activity
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Search | "Search activity" | — | Search field |
| Day divider | "Today" | — | Header |
| Row | "9:41 am, Sent email to Anna, done. Email. Delivered to Anna." | — | Static text |
| Failed row | "6:02 pm, Posted to #general, failed. Slack rejected the message." | "Retry available" | Static text |

- Row is one element. Failed announces "failed" before the cause.
- The timeline rail is hidden with `accessibilityElementsHidden`. The list announces its count.
### Connections
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Row | "Calendar, connected. Can read events and create events." | "Opens service details" | Button |
| Connect | "Connect Calendar" | "Opens the sign-in sheet" | Button |
| Reconnect | "Reconnect Slack" | "Access has expired" | Button |
| Footer | "Permissions are checked before every action." | — | Static text |
### Sessions
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Group | "Today, 3 conversations" | — | Header |
| Row | "Weekly spending. Your week is up 12 percent on dining. 9:41 am." | "Opens the conversation" | Button |
| Row, flagged | "Lunch with Anna. Needs approval. 8:12 am." | "Opens the conversation" | Button |
| Delete | "Delete" | "Deletes this conversation. Activity stays." | Button |
### Settings
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Model | "Model, Balanced" | "Opens model options" | Button |
| Approval rules | "Approval rules, Always ask" | "Asks before every action that changes something" | Radio button |
| Toggle | "Task finished" | — | Switch |
| Delete activity | "Delete all activity" | "Cannot be undone" | Button |

- Each segment is its own radio. The explainer is the hint, so it is not read twice.
### Push and lock screen
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Notification | "Approval needed. Send email to Anna. Running late." | — | Static text |
| Approve | "Approve" | "Requires Face ID" | Button |
| Edit | "Edit" | "Opens the approval" | Button |
| Reject | "Reject" | — | Button |

- Order is app, title, body, time, actions (05 §12). Type is carried by the title alone.
- Live Activity reads "Checking calendar. 12 seconds."
### Desktop shell
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Sidebar landmark | "Navigation" | — | Landmark |
| Main landmark | "Conversation" | — | Landmark |
| Panel landmark | "Approvals and dashboards" | — | Landmark |
| Splitter | "Resize sidebar" | "Use arrow keys" | Slider, value "240 pixels" |

- Sidebar row reads "Weekly spending, 2 minutes ago". The working bar is a polite status region.
### Command bar
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Field | "Search or run a command" | "Type to filter. Press Enter to run." | Combo box |
| Group | "Actions" | — | Header |
| Result | "New session" | "Command N" | Button |
| Ask | "Ask the agent: summarise my week" | "Sends to the agent" | Button |

- Status line: "8 results in 3 groups". Polite, debounced 300ms.
- Approval and destructive commands are excluded by the query, not by the label.
### Menu-bar input
| Element | Label | Hint | Trait |
|---------|-------|------|-------|
| Field | "Ask or tell the agent" | "Press Enter to send" | Text field |
| Recent row | "Weekly spending, 2 minutes ago" | "Opens in the app" | Button |
| Approval row | "1 approval waiting" | "Opens the approval" | Button |
| Open app | "Open assistant" | "Command return" | Button |

- The popover header reads "Assistant, working". Nothing here approves, edits, or deletes.
## 5. Focus and keyboard
### 5.1 Order
| Surface | Order | Roving group | Trap |
|---------|-------|--------------|------|
| Desktop shell | Skip links → sidebar → chat toolbar → stream → composer → panel tabs → queue | Sidebar rows, queue, tabs | No |
| Sheets | Title → content → actions | — | Yes, Esc closes |
| Command bar | Field → results → status | Results | Yes, Esc closes |
| Menu-bar popover | Field → recents → open app | — | Yes, Esc restores focus |
| iOS chat | Nav → stream → chips → composer | Quick chips | No |

- Source order equals visual order. No positive tabindex, ever.
- Focus ring is 2px `accent` at 2px offset (04 §12). The offset keeps it visible on `accent` fills.
- Never remove an outline. Never replace it with a shadow.
### 5.2 Movement
- Focus moves only when the user acts or a surface opens or closes.
- Never move focus on a stream update, a tool step, or an arriving push.
- After approve: focus to Undo, then the collapsed row when Undo expires.
- After reject: focus to the next pending card, else the composer.
- After a sheet closes: focus returns to the control that opened it. Always.
- Esc order: close sheet → clear search → collapse panel (04 §8). `⌘Enter` never fires in a text field.
- Focused content is never hidden by the sticky composer: 96px scroll padding.
- iOS Full Keyboard Access uses the same order. Space activates, arrows move within a list.
### 5.3 Skip links
| Link | Target | Visible |
|------|--------|---------|
| "Skip to chat" | Stream | On focus only |
| "Skip to approvals" | Panel queue | On focus, when the panel is open |
| "Skip to composer" | Message field | On focus only |
## 6. Motor and targets
| Control | Visual | Target | Method |
|---------|--------|--------|--------|
| Button, regular | 44pt / 36px | 44pt / 36px | Fits |
| Button, small | 32pt / 28px | 44pt / 32px | Invisible padding |
| Quick-action chip | 36pt / 28px | 44pt / 32px | Invisible padding |
| Nav glyph | 24pt | 44pt | Invisible padding |
| Log expand chevron | 16pt | 44pt | Row is the target |
| Splitter | 1px | 8px | Drag area, not paint |
| Notification action | — | 44pt | OS honours height |

- Hit areas never overlap. 8pt minimum gap between adjacent iOS targets.
- No drag-only path: swipe delete has long-press and context menus; splitters have arrow keys and View presets.
- No timed-only path: Undo is a convenience, the log entry is the permanent route; a stale push token reopens the card as Expired.
- No multi-point or path gestures. No shake to undo. No double-tap-and-hold.
- Long-press always has a visible equivalent in a menu.
- Every control has a name. No control is icon-only: glyph controls carry an accessible name plus a visible label on hover or focus, or a text label at AX3+.
## 7. Motion and vestibular

Reduce Motion maps every animation to a 120ms cross-fade or to nothing (01 §6).

| Animation | Default | Reduce Motion |
|-----------|---------|---------------|
| Card collapse | `dur-2` height + fade | 120ms fade, height instant |
| Sheet present | Slide up, `dur-2` | 120ms fade |
| Panel open, collapse | Width, `dur-2` | Instant |
| Tool chip step change | `dur-2` cross-fade | Instant swap |
| Streaming caret | Fade, `dur-2` | Caret removed |
| Long-running bar | Indeterminate sweep | Static elapsed time only |
| Dashboard refresh | Rotating glyph | Static glyph + "Refreshing" |
| Voice waveform | Live amplitude | Static level bars |

- Motion is never the only feedback. Every animated change also changes text or a glyph.
- Read the OS setting live. Do not cache it at launch.
- No auto-playing media, no parallax, no ambient loop (01 §6).
## 8. Colour independence
| Colour carries | Second signal |
|----------------|---------------|
| Status pill fill | Word: Pending, Approved, Rejected, Expired, Failed, Done, Connected |
| Approval card state | Status pill word plus the collapsed line |
| Activity dot | Status word in the row plus the glyph shape |
| Failed row tint | "Failed" word, `xmark.octagon` glyph, Retry action |
| Connection state | "Connected", "Access expired", "Reconnect" verb |
| Session status dot | Row label says "Needs approval" or "Last action failed" |
| Chart series | Series label, plus a pattern at 5 series |
| Dashboard staleness | "Updated yesterday" plus `exclamationmark.triangle` |
| Tool chip failure | `danger` glyph plus the cause sentence |
| Focus | 2px ring shape at 2px offset, not a tint change |
| Destructive button | `danger` fill plus the verb "Delete 3 events" |

- No state is readable by hue alone. Counts are digits, never coloured pills.
- Test with a greyscale filter, not by eye.
## 9. Screen-by-screen audit
| Screen | Top 3 risks | Requirement |
|--------|-------------|-------------|
| Chat | Announcement flooding; auto-scroll stealing place; chip as only progress | One announcement per step; scroll only on user action; progress is text |
| Approval | Focus jumping; Undo out of reach; consequence buried | No auto-focus; Undo in the Actions rotor; consequence in the container label |
| Dashboard | Colour-only series; horizontal KPI scroll; refresh glyph only | Named series plus rotor table; KPI scrolls by button; refresh has a label |
| Activity | Dot colour only; dense table at 175%; failed tint only | Word in every label; columns collapse to rows; glyph plus Retry |
| Connections | State by trailing colour; 44pt Connect inside a 64pt row | State as a word; Connect is its own 44pt button |
| Sessions | Dot colour only; swipe-only delete; long titles crowd the row | "Needs approval" in the label; long-press and menu; 2-line title, full title in label |
| Settings | Segmented control without radios; toggle label duplicating state | Radio semantics; label only; `danger` text plus the word |
| Push | Actions under 44pt; type by icon; body leaking | 44pt actions; title carries type; fields limited by 05 §6 |
| Desktop shell | Focus order; collapsed panel hides content; splitter mouse only | Landmark order; rail keeps counts; splitter is a focusable slider |
| Command bar | Trap without escape; unannounced count; forbidden results | Esc closes; polite count; approval and destructive results excluded |
| Menu-bar input | Focus stolen on hotkey; unclear read-only state; focus lost on close | Opens only on request; "Read-only" in the header; focus returns |
## 10. Copy and cognition
- One idea per sentence. 20 words maximum. Two clauses maximum.
- Verb first on buttons: "Approve", "Reject", "Connect Calendar", "Ask again". Never "OK", "Yes", "Submit".
- No jargon in UI. Tool names appear only in Activity detail (02 §14). No double negatives.

**Error formula** — what happened, why if known, what to do next. In that order.

| Slot | Example |
|------|---------|
| What | "Couldn't read your calendar." |
| Why | "Access expired." |
| Next | "Reconnect to keep going." |

| Type | Format | Example |
|------|--------|---------|
| Currency | Symbol, no decimals under 1000, grouped | €412, €1,240 |
| Percent | "percent" spoken, "%" written | 12% |
| Large | Abbreviate at 6 digits, full value on tap | €1.2M |
| Time | Locale format, tabular figures | 9:41 am |
| Relative | Under 24h only, absolute on tap | 2m ago |

- Numbers are never colour-coded. A rise is a word: "up 12 percent".
## 11. Testing checklist

Run every item on both themes, and on at least one platform per client.

**VoiceOver script**
- [ ] Chat: swipe nav to composer; every element reads its §4 label; no unlabelled stops.
- [ ] Approval: card reads as one element, then Reject, Edit, Approve; rotor shows "Actions".
- [ ] Approve, then listen: "Approved. Sent to Anna. Undo available for 10 seconds." Undo is next.
- [ ] Dashboard: every chart reads a summary and offers a table in the rotor.

**Voice Control**
- [ ] Every visible control activates by its spoken label, with no numbered overlay.

**Switch Control**
- [ ] One switch completes: open session, approve, undo.
- [ ] Scan order matches §5. No element is skipped or scanned twice.

**Text size**
- [ ] iOS at AX5 and 320pt: nothing clipped or overlapping; approval buttons stacked.
- [ ] Desktop at 200%: no horizontal scroll, no clipped labels, sidebar overlays.

**Contrast**
- [ ] Every pair in §2 sampled in the running app, not from the token file.
- [ ] Greyscale filter on: every state still readable.
- [ ] Increase Contrast on: edges visible, tints removed, nothing disappears.

**Keyboard only**
- [ ] Complete an approval and an undo without a pointer.
- [ ] Focus is visible at every stop, including on `accent` fills.
- [ ] Esc unwinds sheet → search → panel; focus returns to the trigger each time.
- [ ] Skip links appear on first Tab and land on the named target.

**Motion**
- [ ] Reduce Motion on: no slide, no spin, no sweep; only fades under 120ms.
- [ ] Every animated change also has a text or glyph change.
## 12. Known trade-offs
| # | Trade-off | Decision |
|---|-----------|----------|
| 1 | `success` on `success-tint` is 4.2:1 | Label becomes `text-primary`; glyph and word carry state. Tint stays. |
| 2 | `border-strong` was 1.6:1, below the 3:1 rule | Token raised to `#7C8698` / `#5C6675` (3.7 / 3.3). Labels and rings stay. |
| 3 | 02 forbids approval focus; 03 scrolls to reveal the card | Announce once, never focus. The card is found in normal reading order. |
| 4 | Undo expires in 10s, which is a time limit | The log entry is the permanent, equal path. Undo is an accelerator. |
| 5 | Desktop targets are 32px, below the 44pt iOS floor | Pointer precision justifies 32px. Every desktop target is 32px with a 4px gap. |
