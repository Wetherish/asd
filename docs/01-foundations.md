# 01 — Foundations

Source of truth for every value. Do not invent new tokens.
Anything not listed here is a bug.

---

## 1. Colour

### 1.1 Accent — one only

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `accent` | `#2E5BD7` | `#7A9BFF` | Primary action, links, selection |
| `accent-pressed` | `#244BBB` | `#92AEFF` | Pressed / active |
| `accent-tint` | `#EAF0FF` | `#1B2440` | Selected row, chip fill |
| `accent-on` | `#FFFFFF` | `#0E0F12` | Text/icon on accent fill |

- Contrast: 5.8:1 on white, 7.2:1 on `D0`. AA at all sizes.
- Nothing else may be blue. Not info banners, not charts, not links in body copy beyond `accent`.
- Gradient: **not allowed.** Flat fills only.

### 1.2 Neutrals

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `canvas` | `#FFFFFF` | `#0E0F12` | App background |
| `surface` | `#F7F8FA` | `#16181D` | Cards, list rows |
| `surface-raised` | `#FFFFFF` | `#1D2027` | Sheets, popovers |
| `surface-sunken` | `#EFF1F5` | `#0A0B0E` | Input wells, code |
| `border` | `#DFE3EA` | `#2A2E37` | Hairlines, separators |
| `border-strong` | `#7C8698` | `#5C6675` | Input outlines (3.7:1 / 3.3:1) |
| `text-tertiary` | `#6B7380` | `#9BA3B0` | Timestamps, hints (4.9:1 light) |
| `text-secondary` | `#4A515C` | `#C3C9D4` | Supporting copy (8.0:1 light) |
| `text-primary` | `#1B1F26` | `#F2F4F8` | Body, titles |
| `text-inverse` | `#FFFFFF` | `#0E0F12` | On dark fills |

### 1.3 Semantic — state only

| Token | Light | Dark | Meaning |
|-------|-------|------|---------|
| `success` | `#1B7F4B` | `#5FD08A` | Done, approved, connected |
| `warning` | `#8A5A00` | `#E9B949` | Slow, expiring, needs attention |
| `danger` | `#B3261E` | `#FF8A80` | Failed, rejected, destructive |

- Each has a paired tint at 10% alpha for backgrounds: `success-tint`, `warning-tint`, `danger-tint`.
- Never use semantic colour as decoration. A green dot means done. Nothing else.
- Never colour-only: pair with an icon or a word.

### 1.4 Scrim + overlay

| Token | Value |
|-------|-------|
| `scrim` | `#0E0F12` at 40% (light), 60% (dark) |
| `blur` | Backdrop blur 20, used under sheets only |

### 1.5 Contrast rules
- Body text MUST be ≥4.5:1. Large text (≥20pt semibold) MAY be ≥3:1.
- Borders and non-text UI MUST be ≥3:1 against their adjacent surface.
- Disabled: `text-tertiary` on `surface`, 3:1 is acceptable. Never below.
- Verify against the surface behind the text, not the canvas.

### 1.6 Chart palette
Dashboards need more than one series colour. Resolve it without breaking the one-accent rule.

- Base: accent, then 4 steps of a single sequential ramp derived from it.
- Max 5 series. More than 5 → group the tail into "Other".
- Every series MUST also carry a label or a pattern. Colour is never the only key.
- Gridlines at `border`. Axis labels at `text-tertiary`.

---

## 2. Typography

### 2.1 Families
- iOS / macOS: **SF Pro Text** ≤19pt, **SF Pro Display** ≥20pt.
- Windows: **Segoe UI Variable** — never mix with SF.
- Code / tool names: **SF Mono** / **Cascadia Mono**.
- No display fonts. No custom fonts. No letter-spacing hacks.

### 2.2 iOS scale

| Style | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| Large title | 34 / 41 | Semibold | Screen title on scroll-rest |
| Title 2 | 22 / 28 | Semibold | Section / sheet title |
| Headline | 17 / 22 | Semibold | Card title, action name |
| Body | 17 / 24 | Regular | Messages, copy |
| Callout | 16 / 21 | Regular | Secondary copy |
| Subhead | 15 / 20 | Regular | Metadata, labels |
| Footnote | 13 / 18 | Regular | Timestamps, helper text |
| Caption | 12 / 16 | Medium | Badges only — never body |

### 2.3 Desktop scale

| Style | Size / line | Weight | Use |
|-------|-------------|--------|-----|
| Page title | 28 / 34 | Semibold | Pane title |
| Section | 20 / 26 | Semibold | Group heading |
| Headline | 15 / 20 | Semibold | Card / row title |
| Body | 15 / 22 | Regular | Messages, copy |
| Small | 13 / 18 | Regular | Metadata |
| Micro | 12 / 16 | Medium | Badges, table headers |

- Desktop body is 15, not 17. Denser panes, same hierarchy.
- Optically match: desktop 15 ≈ iOS 17.

### 2.4 Type rules
- Max 3 weights per screen: Regular, Medium, Semibold.
- Line length: 68 characters max in chat. 90 max in dashboards.
- Numerals: tabular in tables, activity log, and any time column.
- Message text uses `text-primary`. Agent name is not restated per bubble.
- Never centre long copy. Centring is for empty states only, 2 lines max.

### 2.5 Dynamic Type
- All sizes are text styles, never fixed points.
- Support up to **AX5**.
- At AX3+: approval card buttons stack vertically, chips wrap to two rows.
- Nothing may truncate at 320pt width. Reflow, don't clip.
- Desktop: UI scale 100–200%. Panes reflow, text never clips.

---

## 3. Spacing

Base unit **4**.

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4 | Icon ↔ label |
| `space-2` | 8 | Tight stacks, chip padding-y |
| `space-3` | 12 | Row padding-y, button padding-x |
| `space-4` | 16 | Card padding, screen margin |
| `space-6` | 24 | Section gap |
| `space-8` | 32 | Pane padding, hero gap |
| `space-12` | 48 | Empty-state breathing room |

- iOS screen margin: **16**. Desktop pane padding: **24**.
- Approval card internal padding: **16**.
- Message stack gap: **12**. Bubble ↔ bubble within a group: **4**.
- Chat content max width: **680pt** / **720px**. Centred, never full-bleed on desktop.

---

## 4. Shape

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 8 | Buttons, inputs, chips (rect) |
| `radius-md` | 12 | Cards, approval, log entries |
| `radius-lg` | 20 | Sheets, full-screen dashboard corners |
| `radius-pill` | 999 | Quick-action chips, avatars, tags |

- Nested radius: inner = outer − padding. Never equal, never larger.
- Border width: **1** everywhere. 0.5 only for hairlines on 3× displays.
- No double borders. No outlined + shadowed cards.

---

## 5. Elevation

Light mode: borders carry structure. Shadow is reserved for things that float.

| Level | Use | Shadow |
|-------|-----|--------|
| 0 | Canvas, cards | none — border only |
| 1 | Sticky input bar | `0 1 3 rgba(14,15,18,.08)` |
| 2 | Sheets, popovers, menu bar panel | `0 8 24 rgba(14,15,18,.16)` |
| 3 | Command bar (Cmd+K) | `0 16 48 rgba(14,15,18,.24)` |

Dark mode: no shadows. Use `surface-raised` + `border` instead.
Elevation is never the only cue for layering — the scrim does that job.

---

## 6. Motion

| Token | Value | Use |
|-------|-------|-----|
| `dur-1` | 120ms | Press, hover, chip select |
| `dur-2` | 220ms | Card state change, sheet, panel |
| `ease` | `cubic-bezier(.2,0,0,1)` | All transitions |

- Motion may only explain a change. No ambient movement.
- Banned: bounce, overshoot, spring, parallax, pulsing glows.
- Streaming text does not animate per character. It appears.
- Tool-status chip: opacity cross-fade between steps, `dur-2`.
- Long-running (>10s): a thin indeterminate bar under the status chip. No spinner.
- Reduce Motion: all transitions → 120ms cross-fade. Waveform → static level bars.

---

## 7. Iconography

- iOS / macOS: **SF Symbols**. Windows: **Segoe Fluent Icons**. Never mix.
- Weight matches adjacent text weight. Size matches cap height, not line height.
- Outline default. Filled only for selected/active.
- 24pt iOS / 16px desktop standard. 44pt hit area regardless.
- No custom illustrations. No 3D. No AI sparkles, brains, or robots.
- Status glyphs: `checkmark.circle` success, `exclamationmark.triangle` warning,
  `xmark.octagon` danger, `clock` pending, `arrow.clockwise` retry.

---

## 8. Voice waveform

Only visual element allowed to be expressive. Still restrained.

- 3 states: idle (flat line), listening (`accent`, live amplitude), processing (static, `text-tertiary`).
- 32 bars, 2pt wide, 2pt gap. Height 4–24pt.
- No colour beyond accent / tertiary. No glow.

---

## 9. Layout grid

| | iOS | Desktop |
|---|---|---|
| Margin | 16 | 24 |
| Content max | 680pt | 720px |
| Min window | — | 960×640 |
| Sidebar | — | 240–280, resizable |
| Right panel | — | 320–420, resizable, collapsible |
| Min tap / click | 44×44pt | 32×32px |
| Row height | 44 min | 36 compact / 44 comfortable |

- Panes never overlap. Below 960px desktop: right panel collapses to a bar.
- iOS uses safe-area insets; nothing sits under the home indicator.
- Keyboard up: chat scrolls, input bar rides above keyboard, chips hide.

---

## 10. Surfaces at a glance

| Element | Light | Dark |
|---------|-------|------|
| Screen | canvas | canvas |
| Card | surface + border | surface + border |
| Sheet | surface-raised + shadow-2 | surface-raised + border |
| Input | surface-sunken + border-strong | surface-sunken + border |
| Selected | accent-tint | accent-tint |
| Divider | border | border |

---

## 11. Hard rules

1. One accent. Semantic colours are state, not style.
2. No gradient, no glow, no shadow in dark mode.
3. Never colour-only meaning.
4. Never fixed font sizes — text styles only.
5. Never clip text to fit. Reflow.
6. Never animate something the user did not cause.
7. Tap targets never shrink below 44pt, even when the visual is smaller.
