# Screens

Screen map and per-screen decisions. ✅ = approved.

## Map

Tabs: `Home · Sessions · Agents · Jobs`. Settings + profile via the avatar.

| Surface | Screens |
|---|---|
| Home | Home hub ✅ |
| Sessions | Sessions list ✅ · Session detail ✅ |
| Agents | Agents list ✅ · Agent detail ✅ |
| Jobs | Jobs list ✅ · Job detail ✅ |
| Settings | Settings ✅ · Connections ✅ · Profile (account row) |
| Overlays | Talk ✅ · New session ✅ · Share sheet ✅ · Artifact viewer ✅ · Notifications + lock screen + Live Activity ✅ |

## Home hub ✅

Greeting (hero) + Talk · "Needs you" (approvals) · Recent · Jobs.

## Session detail ✅ (segmented workspace)

- Segmented: `Chat · Artifacts · Activity`.
- **Chat:** lead agent full-width prose (Montserrat overline); user tinted bubble
  right; sub-agent trace = collapsible card (accent edge); artifact = chip →
  Artifacts; approval inline (`Approve · Edit · Reject`); composer mic + input + send.
- **Artifacts:** artifact cards (kind · name · author · share) + "+ New".
- **Activity:** session-scoped timeline, status dots.

## List screens ✅ (Sessions · Agents · Jobs)

- Large Cormorant title + "New"/"Add"; search on Sessions.
- Card rows: Cormorant title + Montserrat metadata; grouped (day / team / status).
- Jobs: progress bar + status pills (Running / Scheduled / Done / Failed).

## Agent detail ✅

Name + description + Active status · Capabilities tags · Connected services
(permission scope) · Delegation ("Called by") · Recent sessions · Start / Edit.

## Job detail ✅

Name + status pill + progress · Steps (done / running / queued dots) · mono Logs ·
Pause / Cancel.

## Settings ✅

Account · Appearance (Light / Dark / Auto) · Assistant (model, approval rule) ·
Notification toggles · Connections.

## Connections ✅

Optional + task-scoped. "Connected" (scope + dot) vs "Available" (Connect /
Approve). A connection surfaces only when a job requests it.

## Overlays ✅

- **Talk (voice):** dark immersive — Listening · waveform · live transcript ·
  destination · Done / Cancel.
- **New session:** lead-agent picker (radio) · name · invite · Create.

## Artifacts ✅

Types: Table · Doc · Canvas · Dashboard. The **artifact viewer** is generic —
it opens any artifact full-screen. Canvas = freeform shared sketchboard
("Scratch design", the students' scenario).

## Share + lock screen ✅

- Share/invite sheet: members (colored presence dots, no initials) · add people ·
  permission (Can edit / view) · copy link.
- Lock screen: actionable approval (Approve / Reject) · finished-job notice ·
  Live Activity (progress).
