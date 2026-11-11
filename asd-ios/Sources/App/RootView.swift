import SwiftUI

enum Tab: Hashable {
    case home, sessions, agents, jobs
}

enum Appearance: String, CaseIterable {
    case system, light, dark
}

struct RootView: View {
    @AppStorage("appearance") private var appearanceRaw = Appearance.system.rawValue
    @State private var tab: Tab = .home

    private var appearance: Appearance { Appearance(rawValue: appearanceRaw) ?? .system }

    private var preferred: ColorScheme? {
        switch appearance {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }

    var body: some View {
        TabView(selection: $tab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house") }
                .tag(Tab.home)
            SessionsView()
                .tabItem { Label("Sessions", systemImage: "text.bubble") }
                .tag(Tab.sessions)
            AgentsView()
                .tabItem { Label("Agents", systemImage: "person.2") }
                .tag(Tab.agents)
            JobsView()
                .tabItem { Label("Jobs", systemImage: "clock") }
                .tag(Tab.jobs)
        }
        .tint(.accent)
        .preferredColorScheme(preferred)
    }
}
