import SwiftUI

struct SessionsView: View {
    @EnvironmentObject private var store: AppStore
    private let groups = ["Today", "Yesterday", "This week"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(groups, id: \.self) { group in
                        section(group)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Sessions")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("New") { Task { await store.createSession(title: "New session", leadAgentId: "researcher") } }
                        .font(.label(11)).tracking(1.4).textCase(.uppercase)
                        .foregroundColor(.accentText)
                }
            }
        }
    }

    @ViewBuilder
    private func section(_ group: String) -> some View {
        let rows = store.sessions.filter { Format.groupFor($0.updatedAt) == group }
        if !rows.isEmpty {
            SectionLabel(text: group)
            ForEach(rows) { s in
                NavigationLink { SessionDetailView(session: s) } label: {
                    SessionRow(session: s, leadName: store.agentName(s.leadAgentId))
                }
                .buttonStyle(.plain)
            }
        }
    }
}
