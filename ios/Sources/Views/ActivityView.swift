import SwiftUI

@MainActor
struct ActivityView: View {
    @EnvironmentObject var store: AppStore
    @State private var query = ""
    @State private var active = "All"

    private let filters = ["All", "Sent", "Created", "Read", "Failed", "Waiting"]

    var body: some View {
        VStack(spacing: 0) {
            filterBar
            ScrollView {
                if visible.isEmpty {
                    EmptyStateView(
                        glyph: "list.bullet",
                        title: "No activity yet.",
                        line: "Actions will appear here as the agent works."
                    )
                } else {
                    LazyVStack(alignment: .leading, spacing: 0) {
                        ForEach(groups) { group in
                            Text(group.day)
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(Tokens.textPrimary)
                                .padding(.top, Space.s6)
                                .padding(.bottom, Space.s2)
                            ForEach(group.items) { e in
                                LogEntryView(entry: e, isLast: e.id == group.items.last?.id)
                            }
                        }
                    }
                    .padding(.horizontal, Space.s4)
                    .padding(.bottom, Space.s8)
                }
            }
        }
        .background(Tokens.canvas)
        .navigationTitle("Activity")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $query, prompt: "Search activity")
    }

    private var filterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Space.s2) {
                ForEach(filters, id: \.self) { f in
                    let isActive = f == active
                    Button { active = f } label: {
                        HStack(spacing: Space.s2) {
                            Text(f).font(.subheadline)
                            Text("\(count(for: f))").font(.caption).foregroundColor(isActive ? Tokens.accentOn.opacity(0.8) : Tokens.textTertiary)
                        }
                        .padding(.horizontal, Space.s4)
                        .frame(height: 36)
                        .foregroundColor(isActive ? Tokens.accentOn : Tokens.textPrimary)
                        .background(
                            Capsule().fill(isActive ? Tokens.accent : Tokens.surface)
                                .overlay(Capsule().strokeBorder(isActive ? Tokens.accent : Tokens.border))
                        )
                    }
                }
            }
            .padding(.horizontal, Space.s4)
        }
        .padding(.vertical, Space.s2)
    }

    private func count(for f: String) -> Int {
        if f == "All" { return textFiltered.count }
        return textFiltered.filter { classify($0) == f }.count
    }

    private func classify(_ e: LogEntry) -> String {
        switch e.state {
        case .failed, .rejected: return "Failed"
        case .running, .blocked: return "Waiting"
        default: break
        }
        let t = e.title.lowercased()
        if t.hasPrefix("read") { return "Read" }
        if t.hasPrefix("sent") || t.hasPrefix("posted") { return "Sent" }
        return "Created"
    }

    private var textFiltered: [LogEntry] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return store.logs }
        return store.logs.filter {
            $0.title.lowercased().contains(q)
                || $0.tool.lowercased().contains(q)
                || $0.result.lowercased().contains(q)
        }
    }

    private var visible: [LogEntry] {
        guard active != "All" else { return textFiltered }
        return textFiltered.filter { classify($0) == active }
    }

    private var groups: [DayGroup<LogEntry>] {
        var map: [String: [LogEntry]] = [:]
        for e in visible {
            map[dayLabel(e.ts), default: []].append(e)
        }
        return map.keys.sorted { a, b in
            let ta = map[a]?.map(\.ts).max() ?? .distantPast
            let tb = map[b]?.map(\.ts).max() ?? .distantPast
            return ta > tb
        }.map { DayGroup(day: $0, items: map[$0]!) }
    }

    private func dayLabel(_ date: Date) -> String {
        let cal = Calendar.current
        if cal.isDateInToday(date) { return "Today" }
        if cal.isDateInYesterday(date) { return "Yesterday" }
        let f = DateFormatter()
        f.dateFormat = "d MMM"
        return f.string(from: date)
    }
}
