# 06 — States

One matrix for the product. Rows are screens, columns are the nine required states.
Tokens from `01-foundations.md`. Components from `02-components.md`.
Where `03`–`05` already decide a behaviour, this doc repeats it exactly.

---

## 1. State definitions

- **Empty** — no content exists yet; name the next step, never leave a blank surface.
- **Loading** — data is requested; a skeleton holds the final geometry.
- **Streaming** — content arrives in chunks with a caret; nothing types character by character.
- **Long-running** — work passes 10s; elapsed counter plus a thin indeterminate bar.
- **Error** — an operation failed; show the cause and exactly one next step.
- **Pending** — waiting on the user; one expanded approval card, never blocking.
- **Approved** — the user said yes; collapse to a 44pt record with a 10s Undo.
- **Rejected** — the user said no; collapse muted at 60% with "Ask again".
- **Destructive** — irreversible; red, sheet confirm, no default focus.

Two rules sit above the tables:
1. A cell names visible behaviour, not the column label.
2. `N/A` means the state cannot occur on that screen. It is not a backlog item.

---

## 2. Matrix — iOS

Units are pt. "Card" means the inline approval card. "Log" means Activity.

| Screen | Empty | Loading | Streaming | Long-running | Error | Pending | Approved | Rejected | Destructive |
|---|---|---|---|---|---|---|---|---|---|
| Chat | First launch: "Your assistant is ready." + Connect Calendar; new session: chips only | 3-line reply skeleton at 60% width, `surface-sunken`, no shimmer | Caret after the last glyph, chip above, composer active, chips hidden | Chip gains `0:12`, 2pt bar under nav, auto-scroll stops, push if backgrounded | Chip turns `danger`: "Couldn't read your calendar. Tap for details." + Retry ghost | Full card inline, never blocking; one reveal scroll, then no auto-scroll | Collapses to 44pt "✓ Sent to Anna" + Undo for 10s | Collapses at 60%, no tint, "Ask again" proposes a fresh card | Danger glyph, Approve renamed "Delete 3 events", medium-detent sheet |
| Sessions | "No conversations yet." + "Start a chat"; centred, `space-12` below nav | 8 skeleton rows at 72pt; search stays live | `N/A` — a row has no live text | `N/A` — elapsed belongs to the Chat chip | Row dot `danger` when the last action failed; no banner in the list | Row dot `warning` + "needs approval"; delete warns "1 action is waiting for you." | Dot clears; snippet and time move to the latest message | Dot clears; no marker, the log holds the record | Swipe Delete → confirm "Delete this conversation?"; no undo, history stays |
| Dashboard | "No spending in this period." + "Ask to change the date range"; frames stay | 3 KPI + 2 card skeletons at final size; nav and title already render | Charts swap whole at `dur-2`; no per-point animation | Nav subtitle shows the chip "Rebuilding…"; old charts stay readable | Per-card "Couldn't load this chart." + Retry; full failure adds "Ask to rebuild" | `N/A` — decisions happen in Chat | `N/A` — the viewer opens after approval, already settled | `N/A` — a rejected dashboard never opens | `⋯` → Delete dashboard; sheet confirm; close + toast + Undo 10s |
| Activity | "No activity yet." + "Actions will appear here as the agent works." | 6 skeleton rows; rail draws with the first settled entry | `N/A` — entries appear only after a step settles | Hollow dot + "Running…"; elapsed appears in detail after 10s | Only tinted rows: `danger-tint`, `danger` dot, cause, Retry ghost | `warning` dot + "Waiting for approval"; row opens the card | `success` dot + "Done"; result clipped to one line | Neutral dot, 60% opacity, "You rejected this", no Retry | `N/A` — clearing the log lives in Settings |
| Connections | "No services connected." + Connect Calendar; 4 rows stay listed as Disconnected | 4 skeleton rows at 64pt; footer note stays | `N/A` — no text is generated here | "Connecting…" holds past 10s at 70%; no elapsed, no in-app cancel | Trailing "Retry" in `danger` + cause in the scope line; height fixed at 64pt | Disconnect sheet adds "1 pending action will be cancelled." | Pill "Connected" + chevron; scope line lists granted scopes | Cancelled OAuth restores the previous row silently; no error, no banner | Disconnect in the detail sheet; `danger` confirm; row flips on dismiss |
| Settings | `N/A` — the list is fixed, no section can be blank | Model sheet: 3 skeleton rows; settings rows read from cache | `N/A` — no generated text on this screen | `N/A` — the longest write is "Saving…", capped at 1s | "Couldn't load models." + Retry inside the sheet only | Rule change leaves open cards untouched; explainer swaps at `dur-1` | Segment holds the choice + explainer; no toast, no banner | `N/A` — writes are not decisions; a failed write reverts the control | Delete all activity: sheet, `danger` text, no default focus |
| Approval (inline) | `N/A` — a card exists only once an action is proposed | Skeleton rows + "Preparing…"; no buttons until the payload lands | `N/A` — preview values arrive whole | Stays locked on "Approving…"; at 10s adds "Still working. Taking longer than usual."; at 30s times out | Stays open, `danger-tint`, cause line, Retry · Edit · Dismiss | Full preview + Reject · Edit · Approve; newest expanded, others 44pt | 44pt row + Undo; at 10s Undo leaves and the row links to the log | 60%, no tint, "Ask again"; a new proposal is a new card | Danger glyph, verb-named Approve; sheet has no drag-to-dismiss |
| Push / lock screen | No row shown; the lock screen stays system-default | `N/A` — the OS renders the payload, there is no skeleton | `N/A` — pushes carry outcomes, never partial text | Live Activity "⟳ Checking calendar… 0:12"; ends into Notification B after 3s | Auth failed: nothing executes, notification stays, no error copy | "Approval needed" + object; Approve needs Face ID; Edit opens the card | "Sent to Anna" + Undo 10s replaces the approval notification | Notification clears on Reject; no replacement, no sound | "Can't be undone" in the body; Approve still requires biometrics |

`N/A` here (16 of 72): Sessions and Settings never stream; Dashboard is read-only, so decisions resolve in Chat; Activity records outcomes, not decisions; a push cannot be partly delivered.

---

## 3. Matrix — desktop

Units are px. Same behaviours as iOS, expressed for three panes.

| Screen | Empty | Loading | Streaming | Long-running | Error | Pending | Approved | Rejected | Destructive |
|---|---|---|---|---|---|---|---|---|---|
| Chat | 480 centred: "Ask, or pick a starting point." + 2×2 starter cards at 96 tall | Skeletons in main only; sidebar and panel stay interactive | 8 × 80 working bar in the toolbar, chip above the reply, composer active | Bar persists, chip shows `0:12`, title bar "Working…", toast if unfocused | Banner across main; offline send queues; auth adds Reconnect | Inline card plus queue mirror; panel badge and sidebar dot carry the count | Card collapses in stream and queue together; toast with Undo 10s | Both collapse muted; toast has no Undo | Sheet over the window with `scrim`, no default focus, `Esc` cancels |
| Activity | Table frame holds; "No activity yet." centred in the body area | 6 skeleton rows at 40; header, filters and search stay live | `N/A` — the table shows settled entries only | "Running…" in the status column; elapsed appears in the detail pane | `danger-tint` row, glyph always visible; Retry on hover and on focus | "Waiting for approval" row; `Enter` opens the card in the right panel | Done row; result clipped to 200, full text in detail | 60% row, "You rejected this"; no Retry offered | `N/A` — log clearing is a Settings action |
| Dashboard | Panel frame holds; "No spending in this period." + ask-to-change ghost | KPI and card skeletons at final size; toolbar already rendered | Charts swap whole at `dur-2`; tooltips after 120 hover delay | Toolbar subtitle "Rebuilding…"; panel stays scrollable | Per-card Retry; full failure offers Retry · Ask to rebuild | `N/A` — approvals sit in the panel's Approvals tab | `N/A` — the queue resolves it, data refreshes in place | `N/A` — a rejected dashboard never renders | `⋯` Delete → sheet; panel falls back to Approvals, then empty |
| Connections | "No services connected." + Connect Calendar; all 4 rows listed as Disconnected | 4 skeleton rows at 56; pane padding 24, footer note stays | `N/A` — no generated text here | "Connecting…" holds past 10s at 70%; no cancel inside the app | "Retry" in `danger` + cause on the scope line; other rows unaffected | Disconnect sheet adds "1 pending action will be cancelled." | "Connected" pill + scopes; chevron opens the detail sheet | Cancelled OAuth restores the previous control; no toast | Disconnect: sheet, `danger` confirm, row flips on dismiss |
| Settings | `N/A` — fixed list, no blank section | Model sheet: 3 skeletons; rows read from cache | `N/A` — no generated text | `N/A` — "Saving…" resolves within 1s or queues offline | "Couldn't load models." + Retry in the sheet only | Rule change leaves open cards untouched; explainer swaps at `dur-1` | Segment and explainer update; no toast | `N/A` — writes are not decisions; failure reverts the control | Delete all activity: sheet, `scrim`, no default focus, `Esc` cancels |
| Sidebar | Sessions header + "No conversations yet."; nav stays live | 3 skeleton rows at 40; header, nav and footer painted | `N/A` — the list never streams | No progress in the list; the toolbar owns the working state | Session dot `danger` on last-action failure; Activity count updates | `warning` dot on the row; count beside Activity; `⌘2` opens the log | Dot clears on resolve; the sidebar originates no toast | Dot clears; title and snippet unchanged | Right-click Delete → sheet; list closes the gap without animation |
| Right panel | "Nothing needs you." + "Open a dashboard" ghost, centred in 320–420 | 44 skeleton rows while the queue loads; tab counts hidden until ready | `N/A` — the panel holds decisions and artifacts, not text | Age on each queue row keeps counting; the expanded card is unchanged | Card stays open, `danger-tint`, Retry · Edit · Dismiss; badge holds the count | Newest expanded; `↑↓` move, `Enter` expands, `⌘Enter` approves; badge hides at 0 | Row leaves the queue, card collapses in stream; toast + Undo 10s | Row leaves the queue; toast without Undo | Sheet covers the window with `scrim`; `Esc` cancels; no approve-all |

`N/A` here (12 of 63): lists and the panel do not generate text; dashboard decisions resolve in the Approvals tab, never in the viewer.

---

## 4. Transitions

Only these moves exist. Anything not listed is illegal.

### 4.1 Action

| From | To | Fires when | UI |
|---|---|---|---|
| proposed | pending | payload complete | skeleton swaps to the full card at `dur-2` |
| proposed | failed | preparation aborted, app killed | card stays, "Couldn't prepare this. Retry." |
| pending | approved | Approve, inline or push, with biometrics | buttons lock at `dur-1`, label "Approving…" |
| pending | rejected | Reject | collapse, 60% opacity, no tint |
| pending | expired | resource gone, e.g. slot taken | `warning` icon, "Expired", "Ask again" |
| pending | failed | service revoked before the decision | card stays open, `danger-tint`, cause, Retry |
| approved | done | execution confirmed | 44pt line links to the log entry |
| approved | undone | Undo within 10s · reversible actions only | line reads "Undone" + "Ask again" ghost |
| approved | failed | execution fails, the server rejects after approval, or the 30s timeout hits | card reopens, cause + Retry · Edit |

Irreversible actions — sends, and events with guests — skip `undone` entirely.
They go `approved → done` and the row links to the log from the start.
Rule: undo only when the effect stayed inside the account and reached no one else.

### 4.2 Session

| From | To | Fires when | UI |
|---|---|---|---|
| new | active | first message sent | title becomes the first 40 characters |
| active | working | send accepted | chips hide, chip appears within 200ms |
| working | waiting | an action needs a decision | card inline, sidebar dot `warning` |
| waiting | active | card resolved | dot clears, card collapses in place |
| working | stopped | stream interrupted, app killed | "Stopped" + Retry; no partial claim kept |
| stopped | working | Retry | new message appended, the stopped one stays |
| active | deleted | Delete + confirm | list closes the gap, no undo, log entries stay |
| waiting | deleted | Delete + confirm | confirm adds "1 action is waiting for you." |

### 4.3 Dashboard

| From | To | Fires when | UI |
|---|---|---|---|
| proposed | building | approval granted | cover opens on the first rendered card |
| building | ready | first render completes | skeletons replaced, meta row set |
| ready | refreshing | Refresh | cards dim to 40%, meta row "Refreshing…" |
| refreshing | ready | data returns | dim lifts, "Updated now" |
| ready | stale | 24h since the last update | `warning` icon, "Updated yesterday" |
| stale | ready | refresh succeeds | icon clears, timestamp updates |
| ready | failed | full load failure | "This dashboard didn't load." Retry · rebuild |
| failed | building | Ask to rebuild approved | skeletons, nav subtitle "Rebuilding…" |
| ready | deleted | Delete + confirm | cover closes, toast + Undo 10s |
| deleted | ready | Undo within 10s | reopens at the previous scroll offset |

### 4.4 Connection

| From | To | Fires when | UI |
|---|---|---|---|
| disconnected | connecting | Connect tapped | row at 70%, "Connecting…", control locked |
| connecting | connected | system sheet returns granted | pill "Connected", scopes listed |
| connecting | disconnected | sheet cancelled | previous row restored, no error shown |
| connecting | error | provider returns an error | "Retry" in `danger` + short cause |
| error | connecting | Retry | row at 70% again; cause cleared |
| connected | expired | revoked at OS or server | "Reconnect" in `warning` on next foreground |
| expired | connecting | Reconnect | same flow as the first connect |
| expired | disconnected | Disconnect | row loses scopes, footer unchanged |
| connected | disconnecting | Disconnect confirmed | "Disconnecting…", actions disabled |
| disconnecting | disconnected | server confirms | row flips, sheet already dismissed |

### 4.5 Illegal — must never render

| Object | Move | Why | What happens instead |
|---|---|---|---|
| Action | rejected → approved | the decision is closed | "Ask again" creates a new proposed action |
| Action | expired → pending | the resource is gone | "Ask again" re-proposes from scratch |
| Action | done → pending | the record is sealed | a new action needs a new tool call |
| Action | undone → approved | undo is terminal | "Ask again" |
| Action | failed → pending | the card is a closed record | Retry creates a new card, new timestamp |
| Action | failed → approved | no payload was executed | Retry creates a new action |
| Action | approved → pending | the button never returns | Undo, or a new action |
| Session | deleted → active | the session is gone | the log keeps the record; no restore |
| Session | waiting → new | a decision was already asked | resolve the card, then start a new session |
| Dashboard | deleted → refreshing | a closed artifact cannot mutate | Undo restores it as ready |
| Dashboard | ready → building | rebuild is destructive of history | rebuild goes through failed or deleted |
| Connection | expired → connected | access was revoked | Reconnect, or Disconnect |
| Connection | disconnected → expired | nothing to expire | stay disconnected |
| Connection | disconnecting → expired | the revoke is in flight | wait for disconnected or error |

---

## 5. Copy per state

One line per state. Sentence case. No exclamation marks.

| State | Line | Also appears as |
|---|---|---|
| Empty | "No activity yet." | "No conversations yet." · "No services connected." · "Nothing needs you." |
| Loading | No label, skeleton only | "Connecting…" · "Saving…" · "Preparing…" |
| Streaming | No label, caret only | the chip carries the words: "Checking calendar…" |
| Long-running | "Checking calendar… 0:12" | "Rebuilding…" · "Approving…" |
| Error | "Couldn't read your calendar." | "You're offline. Messages will send when you reconnect." · "Calendar access expired." |
| Pending | "Approval needed" | "Sends immediately. Can't be recalled." · "Waiting for you" |
| Approved | "Sent to Anna" | "Lunch scheduled" · "Created dashboard" · "Done" |
| Undone | "Undone" | "Event removed" · "Dashboard deleted" |
| Rejected | "You rejected this" | "Ask again" |
| Destructive | "Delete 3 events?" | "This can't be undone." · "Sends cancellations to 5 people." |

Banned everywhere: "Something went wrong", "Task complete", "Thinking", "Processing",
"Working on it", emoji, exclamation marks.

---

## 6. Timing

Concrete values. Nothing here is a range unless stated.

| Event | Value | Note |
|---|---|---|
| Skeleton appear | 200ms after request | faster than this, swap straight to content |
| Skeleton minimum | 300ms once shown | prevents a flash |
| Tool-status chip appear | 200ms after send or step start | cross-fade at `dur-2` |
| First text chunk | within 2s | no placeholder prose while waiting |
| Chunk cadence | one chunk per 80ms maximum | never per character |
| Caret fade | `dur-2` (220ms) | after the last chunk |
| Long-running threshold | 10s | elapsed `m:ss`, ticks every 1s |
| Working bar | from 10s, continuous | 2pt iOS, 8 × 80 desktop |
| Approve lock | `dur-1` (120ms) | width locked before the label swaps |
| Card collapse | `dur-2` (220ms) | final height 44 |
| Undo window | 10s from execution | no countdown numerals |
| Undo removal | at 10.0s, no animation | row becomes a log link |
| Toast with Undo | stays 10s | leaves when Undo expires |
| Toast without Undo | 4s | dismiss on any tap |
| Finished push delay | 3s | cancelled if the app gains focus |
| Approval push | immediate | never batched behind a delay |
| Coalescing | 1 per session per 60s, 5 per hour app-wide | approvals never throttled |
| Approve token | 5 minutes, single use, device bound | expired token opens the Expired card |
| Approval reassurance | 10s | one line appears; width fixed, height grows by one line |
| Action timeout | 30s | copy: "Timed out after 30s" — exits `Approving…` |
| Retry backoff | 1s, 2s, 4s, then manual | 3 attempts maximum |
| OAuth wait | 120s | timeout restores the previous row, no error |
| Settings save | 1s cap, then queued | row returns to rest after confirmation |
| Dashboard stale | 24h | "Updated yesterday" + Refresh |
| Queue age | minutes to 60m, hours to 24h, then days | tabular figures |

---

## 7. Cross-cutting rules

1. One column per cell. A screen may show two states at once only where listed: chat streams while an approval is pending.
2. No spinner component. Progress is text, a bar, or a state. The Refresh glyph is the only thing that rotates, and only during a refresh.
3. Loading reserves final geometry. Nothing moves when content lands.
4. `N/A` means impossible on that screen. It never means unbuilt.
5. Every irreversible action is destructive: `danger` token, sheet confirm, no default focus — even under "never ask".
6. Approval never blocks. The composer stays enabled in every state except auth-expired.
7. Errors name the cause and one next step. Retry is a Ghost button, never an automatic loop.
8. Undo, where offered, is exactly 10s and never extended. After it, the record links to the log.
9. Streaming adds whole chunks. No character animation, no typing sound, no caret in push copy.
10. State survives relaunch. Approved, rejected and expired render as records; a pending card never replays its fresh animation.
11. Offline is a banner over cached content, not a replacement state. Timestamps stay honest.
12. Semantic colour is always paired with an icon and a word. Never colour alone.
13. `Approving…` never shows elapsed time. It adds one reassurance line at 10s, then times out at 30s.
14. `Refreshing…` keeps the data and dims it. `Rebuilding…` replaces it with skeletons. Never one word for both.

---

## 8. Open questions

None. Refresh vs rebuild is settled by rule 14. Post-approval rejection maps to `failed` (§4.1).
