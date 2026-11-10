# AI Assistant — Design Spec

Chat-first assistant with one cloud agent and two thin clients: iPhone, desktop.
Actions are always visible, and always refusable.

**Format:** written spec. No mockups, no code. Build-ready.
**Status:** complete. No open questions. 9 documents, ~3,100 lines.

---

## Read in this order

| # | Doc | Covers | Who |
|---|-----|--------|-----|
| 00 | `00-overview.md` | Frame, tenets, vocabulary, screen map | everyone |
| 01 | `01-foundations.md` | Colour, type, spacing, motion, icons | design, eng |
| 02 | `02-components.md` | 14 components, all states | design, eng |
| 03 | `03-ios.md` | Screens 1–8, iPhone | design, iOS |
| 04 | `04-desktop.md` | 3-pane, shortcuts, command bar | design, desktop |
| 05 | `05-notifications.md` | Delivery rules, payload privacy | eng |
| 06 | `06-states.md` | State matrix, transitions, timing | eng, QA |
| 07 | `07-accessibility.md` | AA contract, VoiceOver, tests | QA, eng |
| 08 | `08-flows.md` | 4 end-to-end flows, copy | everyone |

Short version: `00` → `03` → `08`.

---

## Big decisions

| # | Decision |
|---|----------|
| 1 | Chat is the interface. Actions render inline, never in a separate inbox. |
| 2 | User messages are bubbles. Agent replies are full-width prose — they hold tables, cards, charts. |
| 3 | One accent (`#2E5BD7` / `#7A9BFF`). Semantic colours are state, never decoration. |
| 4 | Approval is never a modal on iOS. It can be ignored. Only destructive actions get a sheet. |
| 5 | Undo appears only when the change stayed inside the account and reached no one else. |
| 6 | `Approving…` is silent, gains one line at 10s, times out at 30s. |
| 7 | No spinner component. The refresh glyph is the only rotating element. |
| 8 | One primary action per surface. No bulk approve, ever. |
| 9 | Desktop adds panes, never concepts. Width ≥1200 for three panes. |
| 10 | Notify: approvals immediately, finished tasks after 3s, routine steps never. |
| 11 | 44pt iOS / 32px desktop targets. AA contrast, Dynamic Type to AX5. |
| 12 | v1 handles Calendar, Email, Slack, SMS. Dashboards use those sources only. |

---

## Rules that resolve disagreements

Read in this precedence order when two docs conflict:

1. `01` — tokens and values
2. `02` — component behaviour
3. `03` / `04` — layout per platform
4. `06` — state transitions and timing
5. `08` — sequence of events

Higher wins. Then fix the loser.

---

## Scope

**In**
- 4 services, 8 iOS screens, 3 desktop surfaces
- Approvals, undo, activity log, sessions, settings
- Push, lock screen, Live Activity
- Light + dark, WCAG 2.2 AA

**Out**
- Teams, sharing, multi-user
- Authoring tools or prompts
- Web client, Android, iPad-specific layout
- Offline agent (read-only cache at most)

---

## Known gaps

Not blockers. None are specced.

| Gap | Why it matters |
|-----|----------------|
| Visual mockups | Spec is text only. No Figma, no HTML. |
| Sign-in, onboarding, account | First launch assumes an authenticated user. |
| "Agent misunderstood me" | Only tool failures are designed, not wrong results. |
| Brand assets | App icon, share card, service mark treatment undefined. |
| Localisation | English only, LTR only, no string budget. |

**Sharpest gap:** wrong-intent recovery. Today a wrong-but-successful action has no designed repair path beyond the activity log.

---

## Next steps

1. `README` → skim `00`, `03`, `08`
2. Design review: the 12 decisions above
3. Build mockups from `03` + `04` if needed
4. Prototype the approval card first — it carries the product
