# 08 — Flows

Four end-to-end flows. Screens come from 03/04, components from 02, tokens from 01.
Copy is verbatim. States follow the lifecycle in 00.

## 1. Flow index

| Flow | Goal | Entry point | Screens | Platforms | Failure branches |
|---|---|---|---|---|---|
| A — First launch | Install → first dashboard card | Chat 1, empty first-launch state | 1 (iOS); 1 · 5 (desktop) | iOS + desktop, distinct entries | OAuth cancelled once; recoverable |
| B — Spoken dashboard | Voice → saved dashboard, >10s | Chat 1, mic in Composer | 1 · 3 · 8 | iOS primary; desktop from step 3 | One tool failure, retried |
| C — Send a message | Draft → decision → sent | Chat 1, or push 8 | 1 · 2 · 8; desktop right panel | iOS + desktop | Edit, reject, lock screen |
| D — Schedule lunch | Conflict → approval → event | Chat 1, Composer | 1 · 2 · 4 · 8 | iOS + desktop | Slot taken; destructive delete |

Reading order: A is the first run. B–D assume at least one connection.
Column `State` uses the names from 00 and the screen docs.
Approval 2 and the destructive sheet render inline in Chat 1. They are not separate screens.

### 1.1 Screens and components in play

| Screen | Components | Flows |
|---|---|---|
| Chat 1 | Empty state, Quick-action chip, Composer, Voice waveform, Message bubble, Tool-status chip, Approval card, Button | A B C D |
| Approval 2 (inline) | Approval card, Status pill, Button | C D |
| Dashboard viewer 3 | Tool-status chip, Button, Empty state | B |
| Activity log 4 | Filter bar, Log entry, Banner | D |
| Connections 5 | Connection row, Status pill, Banner, Button | A |
| Push / lock screen 8 | Button, Tool-status chip | B C |
| Main chat (desktop) | Same as Chat 1 | A B C D |
| Right panel (desktop) | Approval card, Status pill, Button | B C D |

### 1.2 Every action writes one log entry

| Flow | Action | Log title | Result line | Final state |
|---|---|---|---|---|
| A | Read calendar | `Read calendar` | `14 events` | Done |
| A | Build dashboard | `Created dashboard` | `Week ahead · 14 items` | Done |
| B | Read email | `Read email` | `—` on failure, receipt count on success | Failed → Done |
| B | Build dashboard | `Created dashboard` | `Spending · 12 items` | Done |
| C | Draft email | `Waiting for approval` | `Send email to Anna` | Blocked |
| C | Send email | `Sent email to Anna` | `Delivered to anna@example.com` | Done |
| C | Reject draft | `Rejected email to Anna` | `You rejected this` | Rejected |
| D | Read calendar | `Read calendar` | `14 events` | Done |
| D | Create event | `Created event` | `Lunch with Anna · 2 guests` | Done |
| D | Delete event | `Deleted event` | `Standup · 5 people notified` | Done |

Log rows are never overwritten. A retry adds a new row.

## 2. Flow A — First launch to first result

Same order on both clients. The connection prompt sits on a different surface.

| | iOS | Desktop |
|---|---|---|
| Entry | `Chat` tab, first launch, no connections | `Main chat`, first launch, no sessions |
| Connection prompt | `Empty state` in Chat, primary `Connect Calendar` | Same prompt in Main chat, plus in Connections 5 |
| Result | Dashboard card in Chat | Dashboard card in Main chat, opens in right panel |

| # | Screen | User sees | User can | Agent / system | State |
|---|---|---|---|---|---|
| 1 | Chat 1 · Empty state | Glyph. `Your assistant is ready.` `Connect a service so it can act.` Primary `Connect Calendar`, ghost `Just chat`. 3 example prompts. No notification prompt. | Tap `Connect Calendar`; `Just chat`; an example prompt | `Connect Calendar` opens the system sheet. `Just chat` focuses the Composer. An example prompt sends; without a service the reply asks to connect. | Empty |
| 2 | Chat 1 · Empty state + system sheet | System sheet lists `Read your calendar events`, `Create and edit events`. No explainer screen before it. | Allow; Cancel | The sheet is the OS's. Chat stays behind it. | Loading |
| 3 | Chat 1 · Empty state | Cancel returns to the same empty state. No banner, no error. | Tap `Connect Calendar` again; `Just chat` | Nothing was requested. Cancel is not logged. | Cancelled |
| 4 | Chat 1 · Empty state + system sheet | The same sheet, second attempt. | Allow | Scopes granted. Connection stored. | Loading |
| 5 | Chat 1 · Quick-action chip + Composer | Empty copy replaced by chips `New event` `Send message` `Dashboard` `Check calendar` `Summarise`. Placeholder `Ask or tell the agent…`. | Tap `Check calendar`; type | Connection stored. Chips replace the empty state. No notification prompt. | Empty |
| 6 | Chat 1 · Quick-action chip + Tool-status chip | Chip fills `accent`. Bubble `Check calendar`. Chip `Reading calendar…` `1 of 2`. | Keep typing; scroll | Log: `Read calendar` · Running. Read-only, no approval. | Streaming |
| 7 | Chat 1 · Tool-status chip | `Counting events…` `2 of 2`, cross-fade `dur-2`. | Keep typing; scroll | Steps replace, one chip. | Streaming |
| 8 | Chat 1 · Tool-status chip + Message bubble | Reply `You have 14 events this week.` Dashboard card: `Week ahead` · `7 days` · `14 items` · `Open`. | Tap the card; long-press | Logs: `Read calendar` · `14 events` · Done. `Created dashboard` · Done. | Done |

The flow ends on the dashboard card. The card opens Dashboard viewer 3; Flow B covers the viewer.

- No notification prompt on launch or at any step here. Priming waits for the first task over 10s (B, step 8).
- Desktop shows the same prompt in Main chat and in Connections 5. Either opens the same system sheet.
- Desktop runs steps 2–4 in Connections 5. The row reads `Connecting…`, then `Not connected` after Cancel, then `Connected`.
- Desktop repeats steps 1–8 in order. Only the chrome differs.
- OAuth cancel is silent by design. The only recovery is the same `Connect Calendar` button.

## 3. Flow B — Dashboard from a spoken request (long-running)

Spoken on iOS. Voice inserts text; it never sends.
The desktop branch starts at step 3, because desktop has no mic in v1 scope here.

| # | Screen | User sees | User can | Agent / system | State |
|---|---|---|---|---|---|
| 1 | Chat 1 · Composer + Voice waveform | Mic tapped. Field becomes waveform, `Listening`, timer `0:04`, `Cancel`. | Tap waveform to stop; Cancel | Audio captured. No text yet. | Listening |
| 2 | Chat 1 · Composer | Transcript `Create a dashboard of my weekly spending`. Send button appears. Nothing sent. | Edit text; `Send`; discard | Waits for review. Never auto-sends. | Typing |
| 3 | Chat 1 · Message bubble + Tool-status chip | Bubble right-aligned. Chips hide. Chip `Reading receipts…` `1 of 4`. | Keep typing | Log: `Read email` · Running. | Streaming |
| 4 | Chat 1 · Tool-status chip | Chip turns `danger`: `Couldn't read your inbox.` Line `Nothing was changed. Retry to continue.` Ghost `Retry`. | Tap `Retry`; tap chip for log detail; type | Run paused at 1 of 4. Request and bubble kept. Log: `Read email` · Failed. | Error |
| 5 | Chat 1 · Tool-status chip | `Reading messages…` `1 of 4`, elapsed `0:12`. 2pt indeterminate bar under the nav. | Background the app; type | Resumes at 1 of 4. New log entry. Live Activity starts. | Long-running |
| 6 | Chat 1 · Tool-status chip | `Grouping spend…` `2 of 4`, elapsed `0:19`. | Scroll; type | Steps replace, one chip. | Long-running |
| 7 | Push / lock screen 8 · Tool-status chip (Live Activity) | Chip `Building dashboard…` `3 of 4`, elapsed `0:24`. Lock screen and Dynamic Island: `⟳ Building dashboard… 0:24`. | Tap the Live Activity | No push for progress. | Long-running |
| 8 | Chat 1 · Button (permission sheet) | One time, at the first task over 10s: `Stay in the loop` / `We'll only notify you when something finishes or needs your decision.` `Not now` `Notify me`. | `Not now`; `Notify me` | OS prompt only after `Notify me`. `Not now` returns in 14 days. Task keeps running. | Long-running |
| 9 | Chat 1 · Tool-status chip + Message bubble | `Done` for 1.2s. Reply `Your week is up 12% on dining.` Card `Spending` · `7 days` · `12 items`. If backgrounded and notifications are on: push `Dashboard ready` / `Weekly spending · 12 categories` after 3s. | Tap card; tap push | Logs: `Read email` · Done. `Created dashboard` · Done. Push suppressed if watching. | Done |
| 10 | Dashboard viewer 3 · Button + KPI row | `1–7 Nov · 38 receipts · Updated now`. 3 KPIs. `By category`, `Daily spend`. | Close; refresh; `⋯` menu | Artifact saved. Log unchanged. | Done |
| 11 | Dashboard viewer 3 · Button + nav bar | `⇪` opens the share sheet `Share snapshot`. | Share; close | — | Done |
| 12 | Dashboard viewer 3 · Button (sticky footer) | `✎ Ask the agent to change this`. | Tap the footer | Returns to Chat 1. Composer pre-filled `Ask the agent to change this: Weekly spending`. | Done |

- Desktop: no voice. Steps 3–12 are identical. Live Activity becomes the toolbar bar plus title `Working…`.
- Desktop dashboard opens in the right panel; `⌘⇧F` expands to the window.
- Failure did not lose the request: the bubble and step counter survive, and Retry resumes the same run.

## 4. Flow C — Send a message (approval, edit, reject)

One request, one card, three branch points.
The card stays in stream order. It never jumps to the top.

| # | Screen | User sees | User can | Agent / system | State |
|---|---|---|---|---|---|
| 1 | Chat 1 · Composer | Typed `Message Anna that I'm running late`. Send appears. | Edit; `Send` | — | Typing |
| 2 | Chat 1 · Message bubble + Tool-status chip | Bubble. Chip `Drafting message…` `1 of 2`. | Keep typing; ignore | Log: `Draft email` · Running. Draft only. | Streaming |
| 3 | Chat 1 · Approval card | Skeleton rows, `Preparing…`, no buttons. Card sits where it was proposed. | Keep typing | Draft fills in place. | Proposed |
| 4 | Chat 1 · Approval card | `Send email` + `Pending`. To `anna@example.com`. Subject `Running late`. Body `Hey Anna, running about 15 minutes behind. Start without me.` Consequence `Sends immediately. Can't be recalled.` `Reject` `Edit` `Approve`. | Approve; Edit; Reject; ignore and type | Log: `Waiting for approval`. Card is inline, never a modal. | Pending |
| 5 | Chat 1 · Approval card | Buttons locked. `Approving…` at fixed width. Card does not move. | Wait | Dispatch starts. | Approving |
| 6 | Chat 1 · Approval card | Collapses `dur-2` to `✓ Sent to Anna` + `View in activity`. No Undo: a send cannot be recalled. | `View in activity`; keep typing | Log: `Sent email to Anna` · `Delivered to anna@example.com` · Done. | Approved |
| 7 | Chat 1 · Approval card | Branch: Edit. Fields are live. Body keeps its full value. Header and consequence are fixed. `Cancel` `Approve edited`. | Change body to `Hey Anna, running about 20 minutes behind. Start without me.` `Approve edited`; `Cancel` | Edits submit with the approval, never separately. | Editing |
| 8 | Chat 1 · Approval card | `✓ Sent to Anna` + `View in activity`. | Open log | Log: `Sent email to Anna` · `Edited before sending` · Done. | Approved |
| 9 | Chat 1 · Approval card | Branch: Reject. Collapses, 60%, no tint. `Rejected` pill, `Ask again`. | `Ask again` | Log: `Rejected email to Anna` · `You rejected this`. | Rejected |
| 10 | Chat 1 · Approval card | `Ask again` creates a new card, same draft, new timestamp, `Preparing…`. | Wait | The rejected record stays. | Proposed |
| 11 | Push / lock screen 8 · Button | Branch: app closed. `Approval needed` / `Send email to Anna — Running late`. `Approve` `Edit` `Reject`. | `Approve` → Face ID. `Edit` opens the card. `Reject` needs no auth. | Approve token is single-use, 5 minutes. Nothing runs before Face ID. | Pending |
| 12 | Chat 1 · Approval card | Cold launch deep-links to the card, already collapsed: `✓ Sent to Anna` + `View in activity`. No flash of the pending card. Replacement notification `Sent to Anna`. | Open log | Log: `Sent email to Anna` · Done. | Approved |
| 13 | Right panel · Approvals queue (desktop) + Approval card | Branch: queue row `Send email to Anna` with age. The selected row expands to the full card. Chat scrolls there once. | `⌘Enter` approve; `⌘E` edit; `⌘⇧⌫` reject; `↑↓` move | Approve resolves stream and queue at once. Toast `Sent to Anna`. `⌘Enter` is blocked while focus is in a text field. | Approved |

- No Undo after a send. The row links to the log from the first frame.
- Undo exists for artifacts, not messages. Dashboard delete is the positive case (06 §4.3).
- Typing a new message while the card is pending leaves the card in place. It is never dismissed for you.
- On desktop the card is rendered once. The queue mirrors it; resolving either resolves both.
- The lock screen branch needs notification permission. With notifications off, the approval stays in-app and no push exists.

## 5. Flow D — Schedule lunch (conflict → error → retry → success)

Approval rule for this flow: `Read-only never ask`.
Reads run silently. Writes and deletes still ask.

| # | Screen | User sees | User can | Agent / system | State |
|---|---|---|---|---|---|
| 1 | Chat 1 · Composer | Typed `Schedule lunch Friday at 1pm`. | Edit; `Send` | — | Typing |
| 2 | Chat 1 · Message bubble + Tool-status chip | Bubble. Chip `Checking calendar…` `1 of 3`. No approval card. | Keep typing | Read-only runs freely. Log: `Read calendar` · `14 events` · Done. | Streaming |
| 3 | Chat 1 · Message bubble | `Friday 1pm is taken.` `Standup runs 1:00–1:30 pm.` `Nothing was booked.` Next `Book 1:30–2:30 pm instead?` Ghost `Use 1:30 pm`, `Pick another time`. | `Use 1:30 pm`; type another time; ignore | No write attempted. No failed action to log. | Error |
| 4 | Chat 1 · Approval card | Skeleton rows, `Preparing…`, no buttons. | Keep typing | Builds the event draft at 1:30. | Proposed |
| 5 | Chat 1 · Approval card | `Create event` + `Pending`. Title `Lunch with Anna`. When `Fri 14 Nov, 1:30–2:30 pm`. Where `Café Nero, Kings Cross`. Guests `Anna Nowak, +1`. Consequence `Sends invites to 2 people. Can't be undone.` `Reject` `Edit` `Approve`. | Approve; Edit; Reject | Card locks on Approve and never moves. | Pending |
| 6 | Chat 1 · Approval card | `Approving…`, width fixed. | Wait | Invites dispatch. | Approving |
| 7 | Chat 1 · Approval card | `✓ Invites sent to Anna` + `View in activity`. If unfocused: push `Lunch scheduled` / `Fri 14 Nov, 1:30 pm · Anna`. | Open log | Log: `Created event` · `Lunch with Anna · 2 guests` · Done. | Approved |
| 8 | Chat 1 · Composer | Branch: user types `Actually delete my Friday standup`. | Send; abandon | The earlier read already covers Friday. No new read. | Typing |
| 9 | Chat 1 · Approval card (destructive) | `Delete event` with `danger` glyph + `Pending`. Title `Standup`. When `Fri 14 Nov, 10:00`. Guests `4 others`. Consequence in `danger`: `Sends cancellations to 5 people. Can't be undone.` Button `Delete event`, destructive fill. | Tap `Delete event`; Reject | Delete always asks, even at `Read-only never ask`. No default focus. | Destructive |
| 10 | Chat 1 · Destructive sheet + Approval card | `Delete event?` / `Standup · Fri 14 Nov, 10:00` / `Sends cancellations to 5 people. This can't be undone.` `Cancel` + `Delete event`. | `Cancel`; `Delete event` | Nothing is sent before the confirm. `Esc` dismisses on desktop only. | Destructive |
| 11 | Chat 1 · Approval card | Collapses to `✓ Deleted Standup`. No Undo. | `View in activity` | Log: `Deleted event` · `Standup · 5 people notified` · Done. | Approved |
| 12 | Activity log 4 · Filter bar + Log entry | `Today`. Newest first: `Deleted event` Done, `Created event` Done, `Read calendar` Done. | Filter `Created`; open a detail | Every action has an entry. None is silent. | Done |

- The conflict is an error with a next step, not a dead end. Nothing was written, so nothing needs undoing.
- The destructive confirm is required at every approval setting, including `Read-only never ask`.
- Calendar cards preview four rows: Title, When, Where, Guests. Attendees are names, never addresses.

## 6. Cross-flow rules

1. Every request ends in one of three states: a result, a pending approval, or an error naming the next step.
2. A pending approval never blocks the composer. Typing, sending, and switching sessions leave it in place.
3. Tool status is present progressive, three words or fewer plus `…`, and never a tool name. One chip; steps replace.
4. No spinners. Progress is text, a 2pt indeterminate bar, or a state.
5. Streaming text appears per chunk, never per character. No caret animation beyond `dur-2`.
6. Undo is offered for 10s after a reversible approval. At 10s it is removed, not greyed.
7. Every action writes one `Log entry`, including waiting, rejected, expired, undone, and failed.
8. Errors state what failed, what is safe, and what to do next. `Something went wrong` never ships.
9. Approval cards lock on Approve. No movement, no dismissal, no reflow after the tap.
10. Notifications follow 05: approvals immediately, finished tasks after 3s when over 10s, never routine steps, never launch.

## 7. Copy appendix

Every string below ships as written. Strings are in backticks.

| Flow | Screen | Slot | Copy |
|---|---|---|---|
| A | Chat 1 | Empty title | `Your assistant is ready.` |
| A | Chat 1 | Empty line | `Connect a service so it can act.` |
| A | Chat 1 | Empty primary | `Connect Calendar` |
| A | Chat 1 | Empty ghost | `Just chat` |
| A | Chat 1 | Example prompts | `Create a dashboard of my weekly spending` · `Message Anna that I'm running late` · `Schedule lunch Friday at 1pm` |
| A | Connections 5 | Empty | `No services connected.` |
| A | Connections 5 | Row state | `Not connected` · `Connecting…` · `Connected` |
| A | Connections 5 | Row action | `Connect` |
| A | Connections 5 | Scope line | `Read events · Create events` |
| A | Connections 5 | Permissions | `Read your calendar events` · `Create and edit events` |
| A | Connections 5 | Footer | `Permissions are checked before every action.` |
| A | Chat 1 | Chips | `New event` · `Send message` · `Dashboard` · `Check calendar` · `Summarise` |
| A | Chat 1 | Placeholder | `Ask or tell the agent…` |
| A | Chat 1 | Tool steps | `Reading calendar…` · `Counting events…` |
| A | Chat 1 | Reply | `You have 14 events this week.` |
| A | Chat 1 | Dashboard card | `Week ahead` · `7 days` · `14 items` · `Open` |
| B | Chat 1 | Recording | `Listening` · `Cancel` |
| B | Chat 1 | Transcript | `Create a dashboard of my weekly spending` |
| B | Chat 1 | Send | `Send` |
| B | Chat 1 | Tool steps | `Reading receipts…` · `Grouping spend…` · `Building dashboard…` · `Reading messages…` |
| B | Chat 1 | Failure chip | `Couldn't read your inbox.` |
| B | Chat 1 | Failure line | `Nothing was changed. Retry to continue.` |
| B | Chat 1 | Failure action | `Retry` |
| B | Chat 1 | Reply | `Your week is up 12% on dining.` |
| B | Chat 1 | Dashboard card | `Spending` · `7 days` · `12 items` |
| B | Chat 1 | Permission sheet | `Stay in the loop` · `We'll only notify you when something finishes or needs your decision.` · `Not now` · `Notify me` |
| B | Dashboard 3 | Meta row | `1–7 Nov · 38 receipts · Updated now` |
| B | Dashboard 3 | Chart titles | `By category` · `Daily spend` |
| B | Dashboard 3 | Footer | `Ask the agent to change this` |
| B | Dashboard 3 | Share | `Share snapshot` |
| B | Dashboard 3 | Composer prefill | `Ask the agent to change this: Weekly spending` |
| B | Push 8 | Finished push | `Dashboard ready` · `Weekly spending · 12 categories` |
| C | Chat 1 | Request | `Message Anna that I'm running late` |
| C | Chat 1 | Card header | `Send email` · `Pending` |
| C | Chat 1 | Card recipient | `anna@example.com` |
| C | Chat 1 | Card subject | `Running late` |
| C | Chat 1 | Card body | `Hey Anna, running about 15 minutes behind. Start without me.` |
| C | Chat 1 | Consequence | `Sends immediately. Can't be recalled.` |
| C | Chat 1 | Actions | `Reject` · `Edit` · `Approve` |
| C | Chat 1 | Approving | `Approving…` |
| C | Chat 1 | Edit mode | `Cancel` · `Approve edited` |
| C | Chat 1 | Edited body | `Hey Anna, running about 20 minutes behind. Start without me.` |
| C | Chat 1 | Approved | `Sent to Anna` · `View in activity` |
| C | Chat 1 | Tool step | `Drafting message…` |
| C | Chat 1 | Rejected | `Rejected` · `Ask again` |
| C | Push 8 | Approval push | `Approval needed` · `Send email to Anna — Running late` |
| C | Push 8 | Replacement | `Sent to Anna` |
| C | Right panel | Toast | `Sent to Anna` |
| D | Chat 1 | Request | `Schedule lunch Friday at 1pm` · `Actually delete my Friday standup` |
| D | Chat 1 | Tool step | `Checking calendar…` |
| D | Chat 1 | Conflict | `Friday 1pm is taken.` · `Standup runs 1:00–1:30 pm.` · `Nothing was booked.` |
| D | Chat 1 | Conflict next step | `Book 1:30–2:30 pm instead?` · `Use 1:30 pm` · `Pick another time` |
| D | Chat 1 | Card header | `Create event` |
| D | Chat 1 | Card preview | `Lunch with Anna` · `Fri 14 Nov, 1:30–2:30 pm` · `Café Nero, Kings Cross` · `Anna Nowak, +1` |
| D | Chat 1 | Consequence | `Sends invites to 2 people. Can't be undone.` |
| D | Chat 1 | Approved | `Invites sent to Anna` |
| D | Chat 1 | Destructive card | `Delete event` · `Standup` · `Fri 14 Nov, 10:00` · `4 others` |
| D | Chat 1 | Destructive consequence | `Sends cancellations to 5 people. Can't be undone.` |
| D | Chat 1 | Confirm sheet | `Delete event?` · `This can't be undone.` · `Cancel` |
| D | Chat 1 | Deleted | `Deleted Standup` |
| D | Push 8 | Finished push | `Lunch scheduled` · `Fri 14 Nov, 1:30 pm · Anna` |
| D | Activity 4 | Log titles | `Read calendar` · `Created event` · `Deleted event` |
| D | Activity 4 | Log results | `14 events` · `Lunch with Anna · 2 guests` · `Standup · 5 people notified` |
| All | Activity 4 | Filters | `All` · `Created` · `Today` |
| All | Activity 4 | Log titles | `Read email` · `Draft email` · `Created dashboard` · `Sent email to Anna` · `Rejected email to Anna` |
| All | Activity 4 | Email results | `Delivered to anna@example.com` · `You rejected this` · `Waiting for approval` |
| All | Chat 1 | Tool done | `Done` |
| All | Chat 1 | Proposed card | `Preparing…` |
| All | Chat 1 | Irreversible approval | `View in activity` |
| All | Desktop | Window status | `Working…` |

Banned in these flows: `Something went wrong`, `Task complete`, `Processing`, `Thinking`, `Approve all`.

## 8. Decisions taken

| Flag | Decision |
|---|---|
| Spending source | Dashboards use connected services only. Flow B reads email receipts; meta row says `38 receipts`. No invented bank. |
| Undo vs "can't be recalled" | Sends and events with guests are irreversible. No Undo. Undo stays for artifacts (dashboards) and solo events. |
| Undone state | Added to 02's labels, 03's collapsed row, and 06's transitions. Copy: `Undone` + `Ask again`. |
| Desktop first launch | Mirrors iOS. Same prompt in Main chat and Connections 5. |

## 9. Open questions

None. Undo scope is settled by the confinement rule in 02 §6.6.
