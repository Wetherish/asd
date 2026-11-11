import SwiftUI

struct JobsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    section("Running", key: "running")
                    section("Scheduled", key: "scheduled")
                    section("Recent", key: "recent")
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Jobs")
        }
    }

    private func section(_ label: String, key: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel(text: label)
            ForEach(Seed.jobs.filter { $0.group == key }) { j in
                JobRow(job: j)
            }
        }
    }
}
