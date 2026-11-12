import SwiftUI

struct SessionDetailView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    let session: API.Session

    @State private var seg: Seg = .chat
    @State private var messages: [API.Message] = []
    @State private var artifacts: [API.Artifact] = []
    @State private var streams: [String: String] = [:]
    @State private var loading = true
    @State private var sending = false
    @State private var draft = ""
    @State private var showNewArtifact = false
    @State private var showRename = false
    @State private var renameText = ""
    @State private var confirmArchive = false
    @State private var showTalk = false

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
                case .artifacts: artifactsView
                case .activity: activityView
                }
            }
            .padding(.bottom, 20)
        }
        .background(Color.paper.ignoresSafeArea())
        .navigationTitle(session.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Rename") {
                        renameText = session.title
                        showRename = true
                    }
                    Button("Archive", role: .destructive) { confirmArchive = true }
                } label: {
                    Image(systemName: "ellipsis")
                }
            }
        }
        .sheet(isPresented: $showNewArtifact) {
            NewArtifactSheet(sessionId: session.id) { await loadArtifacts() }
        }
        .fullScreenCover(isPresented: $showTalk) {
            TalkOverlayView(mode: .composer, agents: [], destinationTitle: session.title) { transcript, _ in
                await sendText(transcript)
            }
        }
        .alert("Rename session", isPresented: $showRename) {
            TextField("Name", text: $renameText)
            Button("Save") {
                let trimmed = renameText.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return }
                Task { await store.renameSession(session.id, title: trimmed) }
            }
            Button("Cancel", role: .cancel) {}
        }
        .alert("Archive session?", isPresented: $confirmArchive) {
            Button("Archive", role: .destructive) {
                Task {
                    await store.archiveSession(session.id)
                    dismiss()
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("“\(session.title)” will be archived.")
        }
        .safeAreaInset(edge: .bottom) {
            if seg == .chat { composer }
        }
        .task { await run() }
    }

    // MARK: Data

    private func run() async {
        await load()
        await loadArtifacts()
        for await event in store.client.realtime.events(.session, id: session.id) {
            handle(event)
        }
    }

    private func handle(_ event: RealtimeEvent) {
        switch event {
        case .messageDelta(_, let messageId, let delta):
            streams[messageId] = (streams[messageId] ?? "") + delta
        case .messageDone(_, let messageId):
            streams.removeValue(forKey: messageId)
            Task { await load() }
        case .approvalCreated, .approvalUpdated:
            Task { await load() }
        default:
            break
        }
    }

    private func load() async {
        if let value = try? await store.client.messages(session.id) {
            messages = value
        }
        loading = false
    }

    private func loadArtifacts() async {
        if let value = try? await store.client.sessionArtifacts(session.id) {
            artifacts = value
        }
    }

    private func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty, !sending else { return }
        draft = ""
        Task { await sendText(text) }
    }

    private func sendText(_ text: String) async {
        sending = true
        _ = try? await store.client.sendMessage(session.id, body: text)
        await load()
        sending = false
    }

    // MARK: Chat

    private var chat: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today").overline().frame(maxWidth: .infinity).padding(.top, 14)
            if loading {
                Text("Loading…").font(.label(11)).foregroundColor(.text3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 12)
            } else {
                ForEach(messages) { m in
                    chatRow(m)
                }
            }
        }
        .padding(.horizontal, 20)
    }

    @ViewBuilder
    private func chatRow(_ m: API.Message) -> some View {
        if m.role == .user {
            HStack {
                Spacer()
                Text(m.body)
                    .font(.text(14)).foregroundColor(.ink)
                    .padding(.horizontal, 12).padding(.vertical, 9)
                    .background(Color.accentTint)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .padding(.top, 12)
        } else {
            let body = m.status == .streaming ? (streams[m.id] ?? "") : m.body
            VStack(alignment: .leading, spacing: 0) {
                Text(store.agentName(m.authorId)).overline().padding(.top, 14)
                if m.status == .streaming && body.isEmpty {
                    Text("Typing…").font(.label(11)).foregroundColor(.text3).padding(.top, 4)
                } else {
                    Text(body).font(.text(15)).foregroundColor(.ink).padding(.top, 4)
                }
                if let trace = m.trace, !trace.isEmpty { traceCard(trace) }
                if let refs = m.artifacts, !refs.isEmpty {
                    ForEach(refs, id: \.id) { ref in artifactChip(ref) }
                }
                if let approval = m.approval { approvalCard(approval) }
            }
        }
    }

    @ViewBuilder
    private func traceCard(_ trace: [API.TraceEntry]) -> some View {
        AccentCard {
            VStack(alignment: .leading, spacing: 6) {
                ForEach(trace) { t in
                    VStack(alignment: .leading, spacing: 2) {
                        Text("\(store.agentName(t.agentId)) · \(t.status.rawValue)").overline(Color.accentText)
                        Text(t.title).font(.text(13).weight(.semibold))
                    }
                }
            }
        }
        .padding(.top, 12)
    }

    private func artifactChip(_ ref: API.ArtifactRef) -> some View {
        NavigationLink { ArtifactDetailView(id: ref.id, members: session.members) } label: {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text("Artifact").overline(Color.accentText)
                    Text(ref.name).font(.serifTitle(16))
                }
                Spacer()
                Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
            }
            .cardStyle()
        }
        .buttonStyle(.plain)
        .padding(.top, 12)
    }

    @ViewBuilder
    private func approvalCard(_ approval: API.Approval) -> some View {
        AccentCard {
            VStack(alignment: .leading, spacing: 0) {
                Text(approval.title).font(.serifTitle(18))
                Text(approval.meta).font(.label(11)).foregroundColor(.text3).padding(.top, 2)
                if approval.status == .pending {
                    HStack(spacing: 7) {
                        Button("Approve") { Task { await decide(approval, action: "approve") } }
                            .buttonStyle(PrimaryButtonStyle())
                        Button("Edit") { Task { await decide(approval, action: "edit") } }
                            .buttonStyle(GhostButtonStyle())
                        Button("Reject") { Task { await decide(approval, action: "reject") } }
                            .buttonStyle(DangerButtonStyle())
                    }
                    .padding(.top, 11)
                } else {
                    Text(approval.status.rawValue.capitalized)
                        .font(.label(11)).foregroundColor(statusColor(approval.status))
                        .padding(.top, 8)
                }
            }
        }
        .padding(.top, 12)
    }

    private func decide(_ approval: API.Approval, action: String) async {
        await store.decideApproval(approval.id, action: action)
    }

    private func statusColor(_ status: API.ApprovalStatus) -> Color {
        switch status {
        case .approved: return .success
        case .rejected: return .danger
        case .edited, .pending: return .warning
        }
    }

    // MARK: Artifacts

    private var artifactsView: some View {
        VStack(alignment: .leading, spacing: 10) {
            if artifacts.isEmpty {
                Text("No artifacts yet.").font(.label(11)).foregroundColor(.text3).padding(.top, 8)
            } else {
                ForEach(artifacts) { a in
                    NavigationLink { ArtifactDetailView(id: a.id, members: session.members) } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(a.kind.rawValue).overline(Color.accentText)
                                Text(a.name).font(.serifTitle(19))
                                Text("\(store.agentName(a.authorId)) · updated \(Format.relativeTime(a.updatedAt))")
                                    .font(.label(11)).foregroundColor(.text3)
                            }
                            Spacer()
                            Image(systemName: "square.and.arrow.up").font(.system(size: 16)).foregroundColor(.text2)
                        }
                        .cardStyle()
                    }
                    .buttonStyle(.plain)
                }
            }
            Button { showNewArtifact = true } label: {
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

    // MARK: Activity

    private struct ActivityItem: Identifiable {
        let id = UUID()
        let color: Color
        let title: String
        let meta: String
    }

    private var activityItems: [ActivityItem] {
        var out: [ActivityItem] = []
        for m in messages {
            if m.role == .user {
                out.append(ActivityItem(color: .accent, title: "You sent a message", meta: Format.relativeTime(m.createdAt)))
            } else if m.status == .complete {
                out.append(ActivityItem(color: .success, title: "\(store.agentName(m.authorId)) replied", meta: Format.relativeTime(m.createdAt)))
            }
            if let approval = m.approval {
                let color: Color = approval.status == .approved ? .success : approval.status == .rejected ? .warning : .accent
                let title = approval.status == .pending
                    ? "Awaiting approval — \(approval.title)"
                    : "Approval \(approval.status.rawValue) — \(approval.title)"
                out.append(ActivityItem(color: color, title: title, meta: Format.relativeTime(approval.createdAt)))
            }
        }
        return out.reversed()
    }

    private var activityView: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Today").overline().frame(maxWidth: .infinity).padding(.top, 14)
            ForEach(activityItems) { item in
                activityRow(item.color, item.title, item.meta)
            }
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

    // MARK: Composer

    private var composer: some View {
        HStack(spacing: 9) {
            Button { showTalk = true } label: {
                Image(systemName: "mic")
                    .font(.system(size: 17))
                    .foregroundColor(.text2)
                    .frame(width: 36, height: 36)
            }
            TextField("Message…", text: $draft)
                .font(.text(14))
                .foregroundColor(.ink)
                .padding(.horizontal, 15)
                .padding(.vertical, 10)
                .background(Color.surface)
                .clipShape(Capsule())
                .overlay(Capsule().strokeBorder(Color.border, lineWidth: 1))
                .submitLabel(.send)
                .onSubmit { send() }
            Button { send() } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 17))
                    .foregroundColor(.white)
                    .frame(width: 36, height: 36)
                    .background(Color.accent)
                    .clipShape(Circle())
            }
            .disabled(sending || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
        .padding(.horizontal, 16)
        .padding(.top, 11)
        .padding(.bottom, 8)
        .background(Color.paper)
    }
}

// MARK: - New artifact sheet

private struct NewArtifactSheet: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss

    let sessionId: String
    let onCreated: () async -> Void

    @State private var kind: API.ArtifactKind = .doc
    @State private var name = ""
    @State private var creating = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    SectionLabel(text: "Kind")
                    Picker("Kind", selection: $kind) {
                        Text("Table").tag(API.ArtifactKind.table)
                        Text("Doc").tag(API.ArtifactKind.doc)
                        Text("Canvas").tag(API.ArtifactKind.canvas)
                        Text("Dashboard").tag(API.ArtifactKind.dashboard)
                    }
                    .pickerStyle(.segmented)
                    .tint(.accent)

                    SectionLabel(text: "Name")
                    TextField("\(kind.rawValue) artifact", text: $name)
                        .padding(13)
                        .background(Color.surface)
                        .clipShape(RoundedRectangle(cornerRadius: Radius.card, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: Radius.card, style: .continuous)
                                .strokeBorder(Color.border, lineWidth: 1)
                        )

                    if let error = errorMessage {
                        Text(error).font(.label(11)).foregroundColor(.danger).padding(.top, 10)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("New artifact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(creating ? "Creating…" : "Create") { Task { await create() } }
                        .disabled(creating)
                }
            }
        }
    }

    private func create() async {
        creating = true
        errorMessage = nil
        do {
            let trimmed = name.trimmingCharacters(in: .whitespaces)
            _ = try await store.client.createArtifact(
                sessionId,
                kind: kind,
                name: trimmed.isEmpty ? "\(kind.rawValue) artifact" : trimmed,
                content: API.ArtifactContent.empty(kind)
            )
            await onCreated()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        creating = false
    }
}
