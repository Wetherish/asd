import SwiftUI

@MainActor
struct SessionsView: View {
    @EnvironmentObject var store: AppStore
    @State private var query = ""

    var body: some View {
        List {
            ForEach(groups) { group in
                Section(group.day) {
                    ForEach(group.items) { s in
                        Button { store.selectSession(s.id) } label: {
                            HStack(spacing: Space.s3) {
                                if s.hasPending {
                                    Circle().fill(Tokens.warning).frame(width: 8, height: 8)
                                } else if s.lastFailed {
                                    Circle().fill(Tokens.danger).frame(width: 8, height: 8)
                                }
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(s.title)
                                        .font(.headline)
                                        .foregroundColor(Tokens.textPrimary)
                                        .lineLimit(1)
                                    Text(s.snippet)
                                        .font(.footnote)
                                        .foregroundColor(Tokens.textTertiary)
                                        .lineLimit(1)
                                }
                            }
                        }
                        .swipeActions {
                            Button(role: .destructive) {
                                store.deleteSession(s.id)
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("Sessions")
        .navigationBarTitleDisplayMode(.inline)
        .searchable(text: $query, prompt: "Search conversations")
    }

    private var filtered: [Session] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !q.isEmpty else { return store.sessions }
        return store.sessions.filter {
            $0.title.lowercased().contains(q) || $0.snippet.lowercased().contains(q)
        }
    }

    private var groups: [DayGroup<Session>] {
        var map: [String: [Session]] = [:]
        for s in filtered {
            map[dayLabel(s.ts), default: []].append(s)
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
