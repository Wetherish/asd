import SwiftUI

@main
struct AsdApp: App {
    @StateObject private var store = AppStore.live()

    var body: some Scene {
        WindowGroup {
            Group {
                if store.needsAuth {
                    AuthView()
                } else if store.ready {
                    RootView()
                } else {
                    VStack(spacing: 12) {
                        ProgressView()
                        Text("Connecting…").font(.label(11)).foregroundColor(.text3)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.paper.ignoresSafeArea())
                }
            }
            .environmentObject(store)
            .task { await store.bootstrap() }
        }
    }
}
