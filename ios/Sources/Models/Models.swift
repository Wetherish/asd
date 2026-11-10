import Foundation

// MARK: - Identity helpers

func uid(_ prefix: String = "id") -> String {
    "\(prefix)_\(UUID().uuidString.prefix(12))"
}

enum Seq {
    private static var value = 0
    static func next() -> Int {
        value += 1
        return value
    }
}

// MARK: - Theme

enum Theme: String {
    case system, light, dark
}

// MARK: - Connection

enum ConnectionState: String {
    case disconnected, connecting, connected, expired, error
}

struct Connection: Identifiable {
    let id: String
    var name: String
    var glyph: String // SF Symbol name
    var scopes: [String]
    var state: ConnectionState
    var cause: String?
}

// MARK: - Action

enum ActionState: String {
    case proposed, pending, editing, approving, approved, rejected, expired, failed, done, undone
}

struct PreviewRow: Identifiable {
    let id = UUID()
    var label: String
    var value: String
}

struct Action: Identifiable {
    let id: String
    var sessionId: String
    var type: String // email / calendar / slack / sms / dashboard / file
    var glyph: String
    var title: String
    var preview: [PreviewRow]
    var consequence: String
    var reversible: Bool
    var destructive: Bool
    var state: ActionState
    var resultLine: String?
    var cause: String?
    var seq: Int
    var createdAt: Date
    var approvedAt: Date?
    var undoUntil: Date?
    var approvingLong: Bool
}

// MARK: - Message

enum MessageRole {
    case user, agent, system
}

enum MessageKind {
    case text, dashboardCard, error
}

enum MessageStatus {
    case sending, sent, failed, streaming
}

struct Message: Identifiable {
    let id: String
    var sessionId: String
    var role: MessageRole
    var kind: MessageKind
    var text: String?
    var status: MessageStatus
    var dashboardId: String?
    var dashboardName: String?
    var dashboardMeta: String?
    var retry: Bool
    var seq: Int
    var createdAt: Date
}

// MARK: - Tool status

enum ToolState {
    case queued, running, done, failed, blocked
}

struct ToolStatus: Identifiable {
    let id: String
    var sessionId: String
    var label: String
    var step: Int
    var total: Int
    var state: ToolState
    var cause: String?
    var startedAt: Date
    var seq: Int
}

// MARK: - Log

enum LogState {
    case running, done, failed, blocked, rejected
}

struct LogEntry: Identifiable {
    let id: String
    var sessionId: String
    var ts: Date
    var title: String
    var tool: String
    var result: String
    var state: LogState
    var actionId: String?
}

// MARK: - Dashboard

enum Trend: String {
    case up, down, flat
}

struct DashboardKPI: Identifiable {
    let id = UUID()
    var label: String
    var value: String
    var delta: String
    var trend: Trend
}

struct DashboardChartItem: Identifiable {
    let id = UUID()
    var label: String
    var value: String
    var pct: String?
    var delta: String?
}

struct DashboardChart: Identifiable {
    let id = UUID()
    var title: String
    var items: [DashboardChartItem]
}

enum DashboardState {
    case ready, building, failed, refreshing
}

struct Dashboard: Identifiable {
    let id: String
    var name: String
    var period: String
    var source: String
    var itemCount: Int
    var updatedLabel: String
    var updatedTs: Date
    var stale: Bool
    var state: DashboardState
    var kpis: [DashboardKPI]
    var charts: [DashboardChart]
}

// MARK: - Session + Settings

struct Session: Identifiable {
    let id: String
    var title: String
    var snippet: String
    var ts: Date
    var hasPending: Bool
    var lastFailed: Bool
}

/// A day-grouped collection, used by Activity and Sessions lists.
struct DayGroup<Element>: Identifiable {
    let day: String
    var items: [Element]
    var id: String { day }
}

struct AppSettings {
    var model: String = "Balanced"
    var approvalRule: String = "sending" // always / sending / readonly
    var taskFinished: Bool = true
    var approvalNeeded: Bool = true
    var failures: Bool = true
    var retentionDays: Int = 90
}
