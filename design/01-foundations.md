# Foundations — Studio (paper & ink)

Build-ready design tokens for the rebuild. Everything downstream references
these values; do not introduce new colors, sizes, or durations without updating
this file.

## Color

### Accent

| Token | Value | Use |
|---|---|---|
| `accent` | `#0F766E` | primary actions, active states, focus |
| `accent-pressed` | `#0C5F58` | pressed/active fill |
| `accent-tint` | `#E6F2F0` | selected chips, avatar/thumb backgrounds |
| `on-accent` | `#FFFFFF` | text/icons on accent |

### Neutrals (paper)

| Token | Value | Role |
|---|---|---|
| `paper` | `#FCFBF8` | app background |
| `surface` | `#F4F2EC` | cards, sheets |
| `surface-2` | `#EAE7DE` | inset / nested surfaces |
| `border` | `#DCD8CC` | hairline borders |
| `border-2` | `#C4BFB0` | emphasis border (pressed, focus) |
| `text-3` | `#9A9488` | tertiary / captions |
| `text-2` | `#6B675E` | secondary text |
| `ink` | `#1C1A17` | primary text |

### Semantic

| Token | Value | Use |
|---|---|---|
| `success` | `#1F7A4D` | done, approved, connected |
| `warning` | `#B26A00` | running, attention, pending |
| `danger` | `#C0392B` | failed, rejected, destructive |

Status pills use the semantic color at **14% background** with the solid color
for text + icon.

## Typography

Three roles — **System B** (fashion editorial):

1. **Display serif — Cormorant Garamond** (Google Fonts). Light 300 *italic*
   for the hero/greeting; Regular 400 for titles. Fallback: Georgia.
2. **UI sans — Montserrat** (Google Fonts) for overlines, labels, metadata, and
   the tab bar. Uppercase + tracked for labels. Fallback: Helvetica Neue.
3. **Body — SF Pro** (system) for long-form text (chat, articles). iOS-native,
   most readable at length.

| Style | Font / Weight | Size | Use |
|---|---|---|---|
| Hero | Cormorant 300 italic | 34pt | greeting, screen hero |
| Title | Cormorant 400 | 22pt | card / section titles |
| List title | Cormorant 400 | 17pt | session titles |
| Overline | Montserrat 500, caps | 11pt / +0.22em | masthead overlines |
| Label | Montserrat 500, caps | 10pt / +0.2em | section labels, tab bar |
| Body | SF Pro 400 | 17pt / 1.4 | primary copy, chat |
| Subhead | SF Pro 400 | 15pt | secondary copy |
| Meta | Montserrat 400 | 11pt | metadata, timestamps |
| Trace | SF Mono 400 | 12pt | agent/status traces, IDs |

**Font loading:** Cormorant Garamond + Montserrat must be bundled locally for
offline; fall back to Georgia / Helvetica Neue.

## Spacing

4pt base scale: **4 · 8 · 12 · 16 · 20 · 24 · 32 · 40**.

- `4` — inside chips/pills
- `8` — icon-to-label gap
- `12` — tight gap, card padding (compact)
- `16` — standard gap, card padding
- `20` — section padding
- `24` — section spacing
- `32` — screen-level padding
- `40` — hero spacing

## Radius & shape

| Token | Value | Use |
|---|---|---|
| `radius-chip` | `999` | chips, pills |
| `radius-card` | `12` | cards, buttons, inputs, rows |
| `radius-sheet` | `20` | bottom sheets, modals |

## Motion

Calm, no bounce.

| Token | Value | Use |
|---|---|---|
| `motion-fast` | 150ms | taps, toggles, hover |
| `motion-base` | 250ms | navigation, sheets, cards |
| `easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | everything (ease-out) |

## Iconography

SF Symbols (system), line style, weight regular; **medium** for tab bar and
primary buttons. 16pt default, 12pt in captions. Never emoji.

## Dark mode

Approved — dark mode ships, **light is the default**.

| Token | Light | Dark |
|---|---|---|
| `paper` | `#FCFBF8` | `#141210` |
| `surface` | `#F4F2EC` | `#1E1B17` |
| `surface-2` | `#EAE7DE` | `#26221D` |
| `border` | `#DCD8CC` | `#34302A` |
| `border-2` | `#C4BFB0` | `#4A443C` |
| `text-3` | `#9A9488` | `#857E72` |
| `text-2` | `#6B675E` | `#B5AEA0` |
| `ink` | `#1C1A17` | `#EDE9E2` |
| `accent` (fill) | `#0F766E` | `#0F766E` |
| `accent-text` | `#0F766E` | `#4FD1C5` |
| `accent-tint` | `#E6F2F0` | `#12312E` |

Semantic (dark variants):

| Token | Light | Dark |
|---|---|---|
| `success` | `#1F7A4D` | `#4CAF7D` |
| `warning` | `#B26A00` | `#E0A13B` |
| `danger` | `#C0392B` | `#E05A4E` |
