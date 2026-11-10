import SwiftUI

@main
@MainActor
struct AssistantApp: App {
    @StateObject private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .preferredColorScheme(store.theme == .light ? .light : store.theme == .dark ? .dark : nil)
                .tint(Tokens.accent)
        }
    }
}
