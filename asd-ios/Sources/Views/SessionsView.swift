import SwiftUI

struct SessionsView: View {
    private let groups = ["Today", "Yesterday", "This week"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(groups, id: \.self) { group in
                        SectionLabel(text: group)
                        ForEach(Seed.sessions.filter { $0.group == group }) { s in
                            NavigationLink { SessionDetailView(session: s) } label: { SessionRow(session: s) }
                                .buttonStyle(.plain)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Sessions")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("New") {}
                        .font(.label(11)).tracking(1.4).textCase(.uppercase)
                        .foregroundColor(.accentText)
                }
            }
        }
    }
}
