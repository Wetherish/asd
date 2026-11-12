import SwiftUI

struct AgentDetailView: View {
    let agent: API.Agent

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(agent.name).font(.serifTitle(34))
                Text(agent.description).font(.text(14.5)).foregroundColor(.text2).padding(.top, 6)

                HStack(spacing: 6) {
                    Circle().fill(agent.status == .active ? Color.success : Color.text3).frame(width: 7, height: 7)
                    Text(agent.status == .active ? "Active" : "Paused")
                        .font(.label(10)).tracking(1.2).textCase(.uppercase)
                        .foregroundColor(agent.status == .active ? .success : .text3)
                }
                .padding(.top, 10)

                SectionLabel(text: "Capabilities")
                HStack(spacing: 6) {
                    ForEach(agent.capabilities, id: \.self) { capability in
                        Text(capability).font(.label(9)).tracking(1.2).textCase(.uppercase)
                            .padding(.horizontal, 10).padding(.vertical, 5)
                            .background(Color.surface2).foregroundColor(.text2)
                            .clipShape(Capsule())
                    }
                }

                SectionLabel(text: "Connected")
                if agent.connections.isEmpty {
                    Text("No connections — requested only when a task needs one.")
                        .font(.label(11)).foregroundColor(.text3).padding(.top, 4)
                } else {
                    ForEach(agent.connections) { connection in
                        connRow(connection.service, connection.scope)
                    }
                }

                SectionLabel(text: "Delegation")
                detailRow("Called by", "Lead agents in shared sessions")
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(agent.name)
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            HStack(spacing: 8) {
                Button("Start a session") {}.buttonStyle(PrimaryButtonStyle()).frame(maxWidth: .infinity)
                Button("Edit") {}.buttonStyle(GhostButtonStyle())
            }
            .padding(16)
            .background(Color.paper)
        }
    }

    private func connRow(_ name: String, _ scope: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(name).font(.serifTitle(17))
                Text(scope).font(.label(11)).foregroundColor(.text3)
            }
            Spacer()
            Circle().fill(Color.success).frame(width: 8, height: 8)
        }
        .cardStyle()
    }

    private func detailRow(_ title: String, _ meta: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.serifTitle(17))
                Text(meta).font(.label(11)).foregroundColor(.text3)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
        }
        .cardStyle()
    }
}
