import SwiftUI

struct SessionDetailView: View {
    let session: Session
    @State private var seg: Seg = .chat

    enum Seg: String, CaseIterable {
        case chat, artifacts, activity
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Picker("", selection: $seg) {
                    ForEach(Seg.allCases, id: \.self) { s in
                        Text(s.rawValue.capitalized).tag(s)
                    }
                }
                .pickerStyle(.segmented)
                .tint(.accent)
                .padding(.horizontal, 20)
                .padding(.top, 14)

                switch seg {
                case .chat: chat
                case .artifacts: artifacts
                case .activity: activity
                }
            }
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(session.title)
        .navigationBarTitleDisplayMode(.inline)
        .safeAreaInset(edge: .bottom) {
            if seg == .chat { composer }
        }
    }

    // MARK: Chat

    private var chat: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today").overline().frame(maxWidth: .infinity).padding(.top, 14)

            Text("Researcher").overline().padding(.top, 14)
            Text("Found three vacuums in budget. Builder is pulling live prices & specs.")
                .font(.text(15)).foregroundColor(.ink).padding(.top, 4)

            AccentCard {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Builder · working").overline(Color.accentText)
                        Text("Gathering live prices & specs").font(.text(13).weight(.semibold))
                        Text("2 of 3").font(.label(11)).foregroundColor(.text3)
                    }
                    Spacer()
                    Image(systemName: "chevron.down").font(.system(size: 13)).foregroundColor(.text3)
                }
            }
            .padding(.top, 12)

            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("Artifact").overline(Color.accentText)
                    Text("Shortlist").font(.serifTitle(16))
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
            }
            .cardStyle()
            .padding(.top, 12)

            HStack {
                Spacer()
                Text("Check the warranty too?")
                    .font(.text(14)).foregroundColor(.ink)
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(Color.accentTint)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(.top, 12)

            Text("Researcher").overline().padding(.top, 14)
            Text("Done — two offer a 2-year warranty. I recommend the Shark.")
                .font(.text(15)).foregroundColor(.ink).padding(.top, 4)

            AccentCard {
                VStack(alignment: .leading, spacing: 0) {
                    Text("Order the Shark RV1000?").font(.serifTitle(18))
                    Text("£429 · delivers Thursday").font(.label(11)).foregroundColor(.text3).padding(.top, 2)
                    HStack(spacing: 7) {
                        Button("Approve") {}.buttonStyle(PrimaryButtonStyle())
                        Button("Edit") {}.buttonStyle(GhostButtonStyle())
                        Button("Reject") {}.buttonStyle(DangerButtonStyle())
                    }
                    .padding(.top, 11)
                }
            }
            .padding(.top, 12)
        }
        .padding(.horizontal, 20)
    }

    private var artifacts: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(Seed.artifacts) { a in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(a.kind).overline(Color.accentText)
                        Text(a.name).font(.serifTitle(19))
                        Text("\(a.by) · updated \(a.time)").font(.label(11)).foregroundColor(.text3)
                    }
                    Spacer()
                    Image(systemName: "square.and.arrow.up").font(.system(size: 16)).foregroundColor(.text2)
                }
                .cardStyle()
            }
            Button {} label: {
                Text("+ New artifact")
                    .font(.label(10.5)).tracking(1.4)
                    .foregroundColor(.text2)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(Color.border, style: StrokeStyle(lineWidth: 1.5, dash: [5]))
                    )
            }
            .padding(.top, 4)
        }
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }

    private var activity: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today").overline().frame(maxWidth: .infinity).padding(.top, 14)
            activityRow(.success, "You approved — order the Shark", "just now")
            activityRow(.warning, "Builder gathering live prices", "2 of 3 · running")
            activityRow(.success, "Researcher drafted the shortlist", "3m")
            activityRow(.accent, "Artifact created — Shortlist", "3m")
            activityRow(.success, "Session shared with 3 people", "1h")
            activityRow(.success, "Researcher created the session", "1h")
        }
        .padding(.horizontal, 20)
    }

    private func activityRow(_ color: Color, _ title: String, _ meta: String) -> some View {
        HStack(alignment: .top, spacing: 11) {
            Circle().fill(color).frame(width: 9, height: 9).padding(.top, 4)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.text(13.5).weight(.semibold))
                Text(meta).font(.label(11)).foregroundColor(.text3)
            }
        }
        .padding(.vertical, 9)
    }

    private var composer: some View {
        HStack(spacing: 9) {
            Image(systemName: "mic")
                .font(.system(size: 17))
                .foregroundColor(.text2)
                .frame(width: 36, height: 36)
            Text("Message…")
                .font(.text(14))
                .foregroundColor(.text3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 15)
                .padding(.vertical, 10)
                .background(Color.surface)
                .clipShape(Capsule())
                .overlay(Capsule().strokeBorder(Color.border, lineWidth: 1))
            Image(systemName: "paperplane.fill")
                .font(.system(size: 17))
                .foregroundColor(.white)
                .frame(width: 36, height: 36)
                .background(Color.accent)
                .clipShape(Circle())
        }
        .padding(.horizontal, 16)
        .padding(.top, 11)
        .padding(.bottom, 8)
        .background(Color.paper)
    }
}
