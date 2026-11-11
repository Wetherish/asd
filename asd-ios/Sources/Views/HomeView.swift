import SwiftUI

struct HomeView: View {
    @AppStorage("appearance") private var appearanceRaw = Appearance.system.rawValue
    @Environment(\.colorScheme) private var colorScheme
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Good morning").overline()
                            Text("Alex").font(.display(44))
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

                    Button {} label: {
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
                    AccentCard {
                        VStack(alignment: .leading, spacing: 0) {
                            Text("Send message to Priya").font(.serifTitle(18))
                            Text("Email · ready to send").font(.label(11)).foregroundColor(.text3).padding(.top, 3)
                            HStack(spacing: 7) {
                                Button("Approve") {}.buttonStyle(PrimaryButtonStyle())
                                Button("Review") {}.buttonStyle(GhostButtonStyle())
                            }
                            .padding(.top, 11)
                        }
                    }

                    SectionLabel(text: "Recent")
                    ForEach(Seed.sessions.prefix(2)) { s in
                        NavigationLink { SessionDetailView(session: s) } label: { SessionRow(session: s) }
                            .buttonStyle(.plain)
                    }

                    SectionLabel(text: "Jobs")
                    ForEach(Seed.jobs.filter { $0.group == "running" }) { j in
                        JobRow(job: j)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .toolbar(.hidden, for: .navigationBar)
            .sheet(isPresented: $showSettings) { SettingsView() }
        }
    }
}
