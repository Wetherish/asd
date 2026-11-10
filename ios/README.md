# Assistant — iOS (SwiftUI)

Native iPhone client for the AI Assistant spec (`docs/03-ios.md`). Design tokens
from `docs/01-foundations.md`, components from `docs/02-components.md`. A
simulated agent engine (`Sources/Store/Agent.swift`) drives the flows.

## Build

Requires **Xcode 15+** and **XcodeGen**:

```bash
brew install xcodegen
cd ios
xcodegen generate
open Assistant.xcodeproj
```

Then run the `Assistant` scheme on an iPhone simulator (iOS 17+).

> No XcodeGen? Create a new iOS App project in Xcode, delete the template
> `ContentView.swift`, and add the `Sources/` folder — the app compiles from
> `Sources/` alone.

## Structure

```
Sources/
  App/        AssistantApp (@main), RootView (tab bar)
  Theme/      DesignTokens (colors, spacing, radius, motion)
  Models/     domain models
  Store/      AppStore (ObservableObject), Agent (simulated flows), Seed
  Components/ themed views (button, status pill, chips, approval card, composer…)
  Views/      Chat, Activity, Connections, Sessions, Settings, Dashboard
```

## What's implemented

- Tab bar (Chat · Activity · Settings), push navigation (Sessions, Connections),
  full-screen dashboard cover.
- Chat: user bubbles vs full-width agent prose, tool-status chip, quick chips,
  composer (text + voice waveform), streaming caret.
- Approval card full lifecycle: proposed → pending → editing → approving →
  approved / rejected / failed, plus destructive confirm sheet and 10s Undo.
- Activity timeline (iOS rail style), Connections, Sessions, Settings.
- Simulated flows: read calendar, dashboard (fail → retry), send message
  (approval), schedule lunch (conflict → approval), destructive delete.
- Light / dark theme.

The only "backend" is `Agent.swift`. Swap its flow functions for real API calls
without touching the views.
