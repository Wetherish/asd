import Foundation

/// Display formatting for contract timestamps / metadata (mirrors asd-web/src/format.ts).
enum Format {
    private static let iso: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    static func relativeTime(_ value: String) -> String {
        guard let date = iso.date(from: value) else { return "" }
        let mins = Int(Date().timeIntervalSince(date) / 60)
        if mins < 1 { return "now" }
        if mins < 60 { return "\(mins)m" }
        let hours = mins / 60
        if hours < 24 { return "\(hours)h" }
        let days = hours / 24
        if days < 7 { return "\(days)d" }
        return "\(days / 7)w"
    }

    static func groupFor(_ value: String) -> String {
        guard let date = iso.date(from: value) else { return "This week" }
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Today" }
        if cal.isDateInYesterday(date) { return "Yesterday" }
        return "This week"
    }

    static func logTime(_ value: String) -> String {
        guard let date = iso.date(from: value) else { return "" }
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.string(from: date)
    }

    static func sessionMeta(_ session: API.Session) -> String {
        let count = session.members.count
        return count > 1 ? "Shared · \(count) people" : "Personal"
    }

    static func jobMeta(_ job: API.Job, agents: [API.Agent]) -> String {
        let agent = agents.first { $0.id == job.agentId }?.name ?? job.agentId
        if job.status == .running {
            let total = job.steps.count
            if total > 0 {
                let done = job.steps.filter { $0.status == .done || $0.status == .running }.count
                return "\(agent) · step \(min(done + 1, total)) of \(total)"
            }
        }
        if job.status == .scheduled, let recurring = job.recurring { return "\(agent) · \(recurring.rule)" }
        if job.status == .failed { return "\(agent) · \(job.logs.count) errors" }
        return agent
    }
}
