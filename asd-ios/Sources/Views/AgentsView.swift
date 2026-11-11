import SwiftUI

struct AgentsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    SectionLabel(text: "Your team")
                    ForEach(Seed.agents) { a in
                        NavigationLink { AgentDetailView(agent: a) } label: { AgentRow(agent: a) }
                            .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Agents")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Add") {}
                        .font(.label(11)).tracking(1.4).textCase(.uppercase)
                        .foregroundColor(.accentText)
                }
            }
        }
    }
}
