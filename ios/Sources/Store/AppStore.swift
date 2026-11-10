import SwiftUI
import Combine

struct AppToast: Identifiable {
    let id = UUID()
    var text: String
    var undoLabel: String?
    var onUndo: (@MainActor () -> Void)?
}

/// Single source of truth. Pure state + primitive mutators; orchestration lives
/// in `Agent.swift`. `@MainActor` so every mutation happens on the main thread.
@MainActor
final class AppStore: ObservableObject {
    @Published var theme: Theme = .system
    @Published var activeSessionId: String?
    @Published var connections: [Connection]
    @Published var sessions: [Session]
    @Published var messages: [String: [Message]]
    @Published var actions: [Action]
    @Published var toolStatus: ToolStatus?
    @Published var logs: [LogEntry]
    @Published var dashboards: [String: Dashboard]
    @Published var settings: AppSettings

    // Navigation
    @Published var selectedTab: Tab = .chat
    @Published var dashboardId: String? // non-nil shows the full-screen dashboard

    // Overlays
    @Published var confirmSheet: String? // action id awaiting destructive confirm
    @Published var toast: AppToast?

    func showToast(_ text: String, undoLabel: String? = nil, onUndo: (@MainActor () -> Void)? = nil) {
        toast = AppToast(text: text, undoLabel: undoLabel, onUndo: onUndo)
    }

    func dismissToast() {
        toast = nil
    }

    init() {
        let seed = Seed.make()
        connections = seed.connections
        sessions = seed.sessions
        messages = seed.messages
        actions = []
        logs = seed.logs
        dashboards = seed.dashboards
        settings = seed.settings
        activeSessionId = seed.activeSessionId
    }

    // MARK: - Messages

    func addMessage(_ m: Message) {
        messages[m.sessionId, default: []].append(m)
    }

    func updateMessage(_ id: String, _ update: (inout Message) -> Void) {
        for key in messages.keys {
            if let idx = messages[key]?.firstIndex(where: { $0.id == id }) {
                update(&messages[key]![idx])
            }
        }
    }

    // MARK: - Actions

    func upsertAction(_ a: Action) {
        if let idx = actions.firstIndex(where: { $0.id == a.id }) {
            actions[idx] = a
        } else {
            actions.append(a)
        }
    }

    func updateAction(_ id: String, _ update: (inout Action) -> Void) {
        if let idx = actions.firstIndex(where: { $0.id == id }) {
            update(&actions[idx])
        }
    }

    // MARK: - Logs

    func addLog(_ l: LogEntry) {
        logs.insert(l, at: 0)
    }

    func updateLog(_ id: String, _ update: (inout LogEntry) -> Void) {
        if let idx = logs.firstIndex(where: { $0.id == id }) {
            update(&logs[idx])
        }
    }

    // MARK: - Dashboards

    func upsertDashboard(_ d: Dashboard) {
        dashboards[d.id] = d
    }

    func updateDashboard(_ id: String, _ update: (inout Dashboard) -> Void) {
        if var d = dashboards[id] {
            update(&d)
            dashboards[id] = d
        }
    }

    func removeDashboard(_ id: String) {
        dashboards.removeValue(forKey: id)
    }

    // MARK: - Connections / Sessions

    func updateConnection(_ id: String, _ update: (inout Connection) -> Void) {
        if let idx = connections.firstIndex(where: { $0.id == id }) {
            update(&connections[idx])
        }
    }

    func updateSession(_ id: String, _ update: (inout Session) -> Void) {
        if let idx = sessions.firstIndex(where: { $0.id == id }) {
            update(&sessions[idx])
        }
    }

    // MARK: - Navigation / selection

    enum Tab: Hashable {
        case chat, activity, settings
    }

    func selectSession(_ id: String) {
        activeSessionId = id
        selectedTab = .chat
    }

    @discardableResult
    func createSession() -> String {
        let id = uid("sess")
        let session = Session(
            id: id, title: "New session", snippet: "", ts: Date(),
            hasPending: false, lastFailed: false
        )
        sessions.insert(session, at: 0)
        messages[id] = []
        activeSessionId = id
        selectedTab = .chat
        return id
    }

    func deleteSession(_ id: String) {
        sessions.removeAll { $0.id == id }
        messages.removeValue(forKey: id)
        actions.removeAll { $0.sessionId == id }
        logs.removeAll { $0.sessionId == id }
        if activeSessionId == id {
            activeSessionId = sessions.first?.id
        }
    }
}
