import SwiftUI

struct JobsView: View {
    @EnvironmentObject private var store: AppStore
    @State private var showNew = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    section("Running", status: .running)
                    section("Scheduled", status: .scheduled)
                    section("Paused", status: .paused)
                    section("Done", status: .done)
                    section("Failed", status: .failed)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Jobs")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("New") { showNew = true }
                        .font(.label(11)).tracking(1.4).textCase(.uppercase)
                        .foregroundColor(.accentText)
                }
            }
            .sheet(isPresented: $showNew) {
                NewJobSheet()
            }
        }
    }

    @ViewBuilder
    private func section(_ label: String, status: API.JobStatus) -> some View {
        let rows = store.jobs.filter { $0.status == status }
        if !rows.isEmpty {
            SectionLabel(text: label)
            ForEach(rows) { j in
                NavigationLink { JobDetailView(id: j.id) } label: {
                    JobRow(job: j, meta: Format.jobMeta(j, agents: store.agents))
                }
                .buttonStyle(.plain)
            }
        }
    }
}

private struct NewJobSheet: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var agentId = "researcher"
    @State private var creating = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    SectionLabel(text: "Agent")
                    ForEach(store.agents) { a in
                        Button {
                            agentId = a.id
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(a.name).font(.serifTitle(17))
                                    Text(a.description).font(.label(11)).foregroundColor(.text3)
                                }
                                Spacer()
                                Image(systemName: agentId == a.id ? "largecircle.fill.circle" : "circle")
                                    .foregroundColor(agentId == a.id ? .accent : .text3)
                            }
                            .cardStyle()
                        }
                        .buttonStyle(.plain)
                    }

                    SectionLabel(text: "Title")
                    TextField("e.g. Scrape reviews", text: $title)
                        .padding(13)
                        .background(Color.surface)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                                .strokeBorder(Color.border, lineWidth: 1)
                        )
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("New job")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(creating ? "Creating…" : "Create") { Task { await create() } }
                        .disabled(creating || title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .onAppear {
            if !store.agents.contains(where: { $0.id == agentId }) {
                agentId = store.agents.first?.id ?? agentId
            }
        }
    }

    private func create() async {
        creating = true
        await store.createJob(title: title.trimmingCharacters(in: .whitespaces), agentId: agentId)
        creating = false
        dismiss()
    }
}
