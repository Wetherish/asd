import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    @AppStorage("appearance") private var appearanceRaw = Appearance.system.rawValue
    @Environment(\.colorScheme) private var colorScheme
    @State private var showSettings = false
    @State private var showTalk = false
    @State private var openedSession: API.Session?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Good morning").overline()
                            Text(store.me?.name ?? "Alex").font(.display(44))
                        }
                        Spacer()
                        HStack(spacing: 2) {
                            Button {
                                appearanceRaw = (colorScheme == .dark ? Appearance.light : Appearance.dark).rawValue
                            } label: {
                                Image(systemName: colorScheme == .dark ? "sun.max" : "moon")
                                    .font(.system(size: 17))
                                    .foregroundColor(.text2)
                                    .frame(width: 34, height: 34)
                            }
                            Button { showSettings = true } label: {
                                Image(systemName: "gearshape")
                                    .font(.system(size: 17))
                                    .foregroundColor(.text2)
                                    .frame(width: 34, height: 34)
                            }
                        }
                    }

                    Button { showTalk = true } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "mic").font(.system(size: 17))
                            Text("Talk").font(.label(13)).tracking(1.6).textCase(.uppercase)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Color.accent)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    .padding(.top, 18)

                    SectionLabel(text: "Needs you")
                    if let approval = store.approvals.first {
                        AccentCard {
                            VStack(alignment: .leading, spacing: 0) {
                                Text(approval.title).font(.serifTitle(18))
                                Text(approval.meta).font(.label(11)).foregroundColor(.text3).padding(.top, 3)
                                HStack(spacing: 7) {
                                    Button("Approve") { Task { await store.decideApproval(approval.id, action: "approve") } }
                                        .buttonStyle(PrimaryButtonStyle())
                                    Button("Review") { Task { await store.decideApproval(approval.id, action: "edit") } }
                                        .buttonStyle(GhostButtonStyle())
                                    Button("Reject") { Task { await store.decideApproval(approval.id, action: "reject") } }
                                        .buttonStyle(DangerButtonStyle())
                                }
                                .padding(.top, 11)
                            }
                        }
                    } else {
                        Text("All caught up — nothing needs you right now.")
                            .font(.label(11)).foregroundColor(.text3).padding(.top, 4)
                    }

                    SectionLabel(text: "Recent")
                    ForEach(store.sessions.prefix(2)) { s in
                        NavigationLink { SessionDetailView(session: s) } label: {
                            SessionRow(session: s, leadName: store.agentName(s.leadAgentId))
                        }
                        .buttonStyle(.plain)
                    }

                    SectionLabel(text: "Jobs")
                    ForEach(store.jobs.filter { $0.status == .running }.prefix(3)) { j in
                        JobRow(job: j, meta: Format.jobMeta(j, agents: store.agents))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .navigationDestination(item: $openedSession) { session in
                SessionDetailView(session: session)
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .fullScreenCover(isPresented: $showTalk) {
                TalkOverlayView(mode: .home, agents: store.agents, destinationTitle: nil) { transcript, leadAgentId in
                    let words = transcript.split(separator: " ")
                    let title = words.prefix(6).joined(separator: " ")
                    let agentId = leadAgentId ?? store.agents.first?.id ?? "researcher"
                    if let session = await store.createSession(title: title.isEmpty ? "New session" : title, leadAgentId: agentId) {
                        _ = try? await store.client.sendMessage(session.id, body: transcript)
                        openedSession = session
                    }
                }
            }
        }
    }
}
