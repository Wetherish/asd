# 04 — Desktop

macOS 14+ and Windows 11. Same concepts as iOS, one extra pane.
Nothing here may introduce a concept the phone does not have.

---

## 1. Window shell

| | Value |
|---|---|
| Min size | 960 × 640 |
| Default | 1280 × 820 |
| Sidebar | 240–280, resizable, collapsible |
| Main | 480 min, fluid |
| Right panel | 320–420, resizable, collapsible |
| Pane padding | 24 |
| Chat content max | 720, centred in main |

```
┌────────────┬──────────────────────────┬───────────────┐
│  Sidebar   │  Chat                    │  Right panel  │
│            │                          │               │
│  Assistant │  Weekly spending  ⋯      │ Approvals (2) │
│  ⌘K Search │  ─────────────────────   │  ├ Send email │
│            │                          │  └ Create evt │
│  Sessions  │  Assistant               │               │
│  Activity  │  Your week is up 12%…    │               │
│  Connect.  │                          │               │
│  ────────  │  ⟳ Checking calendar…    │               │
│  Today     │                          │               │
│  Weekly…   │  You                     │               │
│  Lunch…    │  ┌────────────────────┐  │               │
│            │  │ lunch Friday 1pm   │  │               │
│  ⚙ Settings│  └────────────────────┘  │               │
└────────────┴──────────────────────────┴───────────────┘
```

### Breakpoints

| Width | Behaviour |
|-------|-----------|
| ≥ 1200 | All three panes |
| 960–1199 | Right panel collapsed to a 44 rail with counts |
| < 960 | Not supported. Window refuses to shrink. |

- Splitters: 1pt `border`, 8pt hit area, cursor `col-resize`.
- Double-click a splitter resets it to default width.
- Pane widths persist per user, per machine.
- Collapse state persists. Restore exactly on relaunch.

### Title bar
- **macOS** — unified toolbar, traffic lights inset, no vibrancy. Solid `canvas`.
- **Windows** — custom caption: icon + title left, caption buttons right, 32px.
- Drag region is the whole top bar except controls.
- Title shows the active session name. Falls back to "Assistant".

---

## 2. Sidebar

### Anatomy

1. **Header** — agent name (Headline) + connection status dot.
2. **Command bar trigger** — full-width row, `⌘K` right-aligned, looks like a field.
3. **Nav** — Activity (with pending/failed counts), Connections.
4. **Sessions** — grouped list, scrolls independently of nav.
5. **Footer** — Settings, account.

### Rows

| Element | Spec |
|---|---|
| Height | 40 |
| Padding | 12 × 8 |
| Radius | `radius-sm` |
| Default | transparent |
| Hover | `surface` |
| Selected | `accent-tint`, text `accent` |
| Focus | 2px `accent` ring, 2px offset |

- Session row: title 1 line + relative time, right-aligned `text-tertiary`.
- Status dot: `warning` for pending approval, `danger` for last-action failure.
- Counts are `text-tertiary`, never badges. No red pills.

### Behaviour
- `⌘1` Chat · `⌘2` Activity · `⌘3` Connections · `⌘,` Settings.
- Right-click a session: Rename, Delete.
- New session button sits in the Sessions header, 24pt glyph.
- Sidebar scroll is independent; the selected session stays visible.

---

## 3. Main chat

Same rules as iOS. Differences:

| Element | Desktop |
|---|---|
| Width | 720 max, centred |
| User bubble | 560 max |
| Body | 15 / 22 |
| Enter | Sends · Shift+Enter newline |
| Composer | Sticky, 1pt top border, no shadow |
| Tool status | Chip, same copy, same behaviour |
| Approval cards | Inline, same card, plus queue mirror |

### Chat toolbar
`Session title` · model chip (Ghost, opens model sheet) · working indicator ·
right-panel toggle · `⋯` (Rename, Export, Clear).

- Working indicator = 8pt `accent` bar, indeterminate, 80pt wide. No spinner.
- Clicking the model chip opens the same 3-option sheet as Settings.

### Empty state

**No sessions, connected**
- Centred, 480 wide.
- Title: "Ask, or pick a starting point."
- 2×2 grid of example cards, 96pt tall, `surface` + `border`, hover `accent-tint`.
- One card = one real prompt, verbatim. No marketing copy.

**First launch, no connections**
- Same frame. Title: "Your assistant is ready."
- Line: "Connect a service so it can act."
- Primary `Connect Calendar`, ghost `Just chat`.
- Starters sit below, `text-tertiary`, inert until a connection exists.
- The same prompt appears in Connections 5. Two entries, one system sheet.

### Approval in stream vs queue
- The card is rendered once. The queue is a **navigation mirror**, not a second copy.
- Clicking a queue item scrolls the chat to that card and focuses it.
- Resolving in either place resolves both. One source of truth.

---

## 4. Right panel

Two modes, one panel. Tabs only when both have content.

```
┌──────────────────────────────┐
│ Approvals 2  │  Dashboard    │
├──────────────────────────────┤
│ ▸ Send email to Anna         │
│ ▾ Create event               │
│   Title  Lunch with Anna     │
│   When   Fri 1:00 pm         │
│   …                          │
│   [Reject] [Edit] [Approve]  │
└──────────────────────────────┘
```

### Default mode
- Pending approvals → Approvals tab, newest expanded.
- Else last opened dashboard → Dashboard tab.
- Else empty state: "Nothing needs you." + "Open a dashboard" ghost.

### Approvals queue
- Compact rows 44: glyph, title, age. Selected row expands to the full card.
- One expanded at a time. Selecting moves focus, does not approve.
- `↑` `↓` move selection. `Enter` expands. `⌘Enter` approves.
- **No "Approve all".** Bulk approval is never offered for sending actions.
- Badge on the tab = pending count. Hidden at 0.

### Dashboard mode
- Same cards as iOS, 2-column grid at ≥ 360 width, 1-column below.
- Toolbar at the top of the panel: refresh, share, expand-to-window.
- "Ask the agent to change this" focuses the composer with the phrase pre-filled
  and the dashboard name appended.

### Collapse
- `⌘\` toggles. Collapsed rail: 44 wide, vertical labels + counts.
- Clicking a rail tab opens the panel in that mode.

---

## 5. Activity log

### Layout

```
┌──────────────────────────────────────────────────────────┐
│ Activity                                    🔍  filters  │
├──────────┬─────────────────────┬──────────┬──────────────┤
│ Time     │ Action              │ Status   │ Result       │
├──────────┼─────────────────────┼──────────┼──────────────┤
│ 09:41    │ Sent email to Anna  │ ● Done   │ Delivered    │
│ 09:38    │ Created dashboard   │ ● Done   │ 12 items     │
│ 09:30    │ Read calendar       │ ● Done   │ 14 events    │
│ 18:02    │ Posted to #general  │ ✕ Failed │ Retry        │
└──────────┴─────────────────────┴──────────┴──────────────┘
```

### Spec
- Columns: Time 80 · Action fluid · Tool 140 · Status 120 · Result 200.
- Row height 40 comfortable / 32 dense. Density toggle in the header.
- Sticky header, 1pt `border`, `surface` background.
- Day dividers as full-width 32px rows, sticky.
- Failed rows: `danger-tint` background, glyph always visible (never hover-only).
- Row actions appear on hover **and** on focus: Retry, Copy ID, Open in chat.
- Selecting a row opens Action detail in the right panel, keeping the table visible.

### Filters
- Chips: All · Sent · Created · Read · Failed · Waiting.
- `Status` dropdown for compound filters: status × service × date.
- Search: `⌘F` focuses, matches action + result text.
- Active filter count shown in the header, "2 filters · Clear".

### Keyboard
- `↑` `↓` move, `Enter` open detail, `Esc` close detail.
- `⌘F` search, `Esc` clears search first.

---

## 6. Dashboard viewer

### In-panel
- 1–2 columns. Card padding 16. Same card anatomy as iOS.
- KPI row scrolls horizontally, 2.4 visible.

### Full window
- Expand icon in the panel toolbar, or `⌘⇧F`.
- Sidebar collapses, right panel hides, main becomes the dashboard canvas.
- Grid 2–4 columns by width. `Esc` returns to the three-pane layout.
- Toolbar: name, period, updated, share, refresh, ask-to-change, exit.

### Interaction
- Chart hover: tooltip with series, value, and date. 120ms delay.
- Charts are focusable. `←` `→` traverse points; the value is announced.
- Legend items toggle series; state is not persisted.
- Tables inside dashboards: sortable headers, 36px rows, tabular numerals.

---

## 7. Command bar — `⌘K`

```
        ┌────────────────────────────────────────┐
        │  ⌘  Search or run a command…           │
        ├────────────────────────────────────────┤
        │  Actions                               │
        │  ✎  New session              ⌘N        │
        │  ⚙  Open settings            ⌘,        │
        │  ◐  Toggle theme                       │
        │  Sessions                              │
        │  💬 Weekly spending           2m       │
        │  Ask                                   │
        │  →  Ask the agent: "summarise…"  ↵     │
        ├────────────────────────────────────────┤
        │  ↑↓ move   ↵ select   esc close        │
        └────────────────────────────────────────┘
```

| | Value |
|---|---|
| Width | 640 |
| Position | Top 20% of window, centred |
| Scrim | 40% light / 60% dark |
| Shadow | level 3 |
| Results | max 8 per group, 3 groups max |
| Match | fuzzy on label, then on keywords |

### Groups, in order
1. **Actions** — navigation and app commands.
2. **Sessions** — recent 5, matched by title.
3. **Ask** — always last. Sends the raw query to the agent.

### Rules
- Never lists destructive commands. Delete lives in context menus only.
- Approval actions are excluded. Approving requires reading the card.
- Free text with no match still works: "Ask the agent: …".
- Empty query: 3 recent sessions + 4 top actions.
- Fully keyboard-driven. Mouse optional.

---

## 8. Shortcuts

macOS `⌘`. Windows `Ctrl`. Everything reachable by keyboard alone.

| Keys | Action |
|------|--------|
| `⌘K` | Command bar |
| `⌘N` | New session |
| `⌘1` `⌘2` `⌘3` | Chat · Activity · Connections |
| `⌘,` | Settings |
| `⌘\` | Toggle right panel |
| `⌘⇧F` | Expand dashboard to window |
| `⌘F` | Search (context: sessions, activity, dashboard) |
| `⌘Enter` | Approve the focused approval |
| `⌘E` | Edit the focused approval |
| `⌘⇧⌫` | Reject the focused approval |
| `⌘Z` | Undo the last approved action (10s window) |
| `↑` `↓` | Move selection in queue / list |
| `Esc` | Close sheet → clear search → collapse panel |

- Shortcuts are listed in native menus on macOS and in the `?` sheet on Windows.
- `⌘Enter` must never fire when focus is in a text field.
- `⌘Z` outside the undo window shows "Nothing to undo" as a toast. No modal.

---

## 9. Menu-bar quick input

### macOS
- Menu-bar icon: SF Symbol agent glyph, template image, no colour.
- Click → 400 × 520 popover, anchored under the icon.
- Global hotkey: `⌘⇧Space`.

### Windows
- System tray icon, same behaviour, `Ctrl+Shift+Space`.
- Popover is a borderless top-most window, 400 × 520, `radius-md`.

### Contents
```
┌──────────────────────────────────┐
│  Assistant            ● Working  │
├──────────────────────────────────┤
│  ⟳ Checking calendar…    0:12    │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │ Ask or tell the agent…   ↑ │  │
│  └────────────────────────────┘  │
│  Recent                          │
│  Weekly spending          2m     │
│  Lunch with Anna          1h     │
├──────────────────────────────────┤
│  Open app            ⌘↩          │
└──────────────────────────────────┘
```

### Rules
- **Read-only.** No approvals, no destructive actions, no editing.
- If an approval is waiting, show a single row: "1 approval waiting → Open".
- Enter sends. `Esc` closes. Focus returns to the previous app on close.
- Never steals focus when it opens from a hotkey while typing elsewhere — the user asked for it, so it may.
- No dock/taskbar bounce. No badges on the app icon beyond a count.

---

## 10. Platform notes

| | macOS | Windows |
|---|---|---|
| Font | SF Pro | Segoe UI Variable |
| Icons | SF Symbols | Segoe Fluent Icons |
| Motion | system easing | system easing |
| Scrollbars | overlay, auto-hide | visible, 8px |
| Menus | native menu bar mirrors shortcuts | custom `⋯` + `?` sheet |
| Full screen | supported | maximised only |
| Multiple windows | supported, shared state | single window |
| Trailing punctuation in titles | none | none |

---

## 11. States

| State | Desktop |
|-------|---------|
| Empty — first launch | Sidebar: no sessions. Chat: "Your assistant is ready." + `Connect Calendar`. Panel: "Nothing needs you." |
| Loading | Skeletons in main. Sidebar and panel stay interactive. |
| Streaming | Working bar in toolbar, chip above reply, composer active. |
| Long-running | Toolbar bar persists, chip shows elapsed, title bar shows "Working…". Push fires if unfocused. |
| Error — offline | Banner across main. Sidebar/panel from cache. Send queues. |
| Error — auth | Banner with Reconnect. Affected service rows flip to Expired. |
| Approval pending | Panel badge + tab expanded. Sidebar dot on session. |
| Approved | Card collapses in stream and queue simultaneously. Toast with Undo. |
| Rejected | Same, muted. Toast has no Undo. |
| Destructive | Sheet over the window, scrim, no default focus. `Esc` cancels. |
| Narrow window | Right panel auto-collapses at 1200. No horizontal scrolling, ever. |

---

## 12. Accessibility

- Full keyboard access. Every control reachable, visible focus at all times.
- Focus ring: 2px `accent`, 2px offset, never removed.
- Landmarks: `navigation` sidebar, `main` chat, `complementary` right panel.
- Roving tabindex in sidebar and queue; `↑` `↓` move without tabbing.
- Total order is announced after dynamic changes: use polite live regions only.
- Zoom to 200%: panes reflow, sidebar overlays below 960, nothing clips.
- Approve/reject require an explicit activation. No hover-triggered or timed actions.
- High contrast mode: borders strengthen to `border-strong`, tints removed.

---

## 13. Edge cases

- 5+ pending approvals: queue scrolls, tab shows "5", newest expanded.
- Approve in the queue while the chat is scrolled elsewhere: chat animates once to the collapsed card.
- Session opened in a second window (macOS): both windows show the same state. No duplicate cards.
- Window restored off-screen: clamp to the nearest display.
- App quit with unsent text: restore the draft.
- Dashboard panel open, then the dashboard is deleted: panel falls back to Approvals, then empty.
- Offline approve: not allowed. Button disabled with "You're offline" tooltip and a banner.
- Command bar typed while a sheet is open: `⌘K` is blocked by the sheet. Expected.
