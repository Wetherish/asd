# asd — iOS (SwiftUI)

Native iPhone client for the design spec (`design/00..02`). Implements the
"Studio / System B" design system (paper + teal, Cormorant display type, Montserrat
labels) and the full screen map: Home, Sessions, Session detail (segmented),
Agents + detail, Jobs, Settings.

## Build

Requires **Xcode 15+** and **XcodeGen**:

```bash
brew install xcodegen
cd asd-ios
xcodegen generate
open asd.xcodeproj
```

Run the `asd` scheme on an iPhone simulator (iOS 17+).

> No XcodeGen? Create a new iOS App project in Xcode, delete the template
> `ContentView.swift`, and add the `Sources/` folder — the app compiles from
> `Sources/` alone.

## Fonts

The design calls for **Cormorant Garamond** (display) and **Montserrat** (labels).
The scaffold ships with system serif/sans fallbacks so it builds out of the box.
To use the real fonts: download the `.ttf` files, add them to the target, and
register them in `Info.plist` (`UIAppFonts`), then update `Theme.swift`
(`Font.display` / `Font.label`).

## Structure

```
Sources/
  App/          AsdApp (@main), RootView (tab bar, appearance)
  Theme/        Theme (colors, fonts, spacing, modifiers)
  Models/       domain models + seed data
  Components/   Pill, SectionLabel, rows, button styles, AccentCard
  Views/        Home, Sessions, SessionDetail, Agents, AgentDetail, Jobs, Settings
```

All data is mock (`Models/Models.swift`). Swap it for a real agent API / AWS
backend without touching the views.
