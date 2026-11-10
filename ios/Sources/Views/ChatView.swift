import SwiftUI

enum StreamItem {
    case message(Message)
    case action(Action)

    var seq: Int {
        switch self {
        case .message(let m): return m.seq
        case .action(let a): return a.seq
        }
    }
}

struct TimelineEntry: Identifiable {
    let id: String
    let item: StreamItem
    let groupLabel: Bool
}

@MainActor
struct ChatView: View {
    @EnvironmentObject var store: AppStore

    private let examples = [
        "Create a dashboard of my weekly spending",
        "Message Anna that I'm running late",
        "Schedule lunch Friday at 1pm",
    ]

    var body: some View {
        VStack(spacing: 0) {
            if store.activeSessionId == nil {
                EmptyStateView(
                    glyph: "bubble.left.and.bubble.right",
                    title: "Your assistant is ready.",
                    line: "Connect a service so it can act.",
                    actionLabel: "Connect Calendar",
                    action: { store.selectedTab = .settings }
                )
            } else {
                content
                Composer()
            }
        }
        .background(Tokens.canvas)
        .navigationTitle(navTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                if store.activeSessionId != nil {
                    NavigationLink { SessionsView() } label: {
                        Image(systemName: "line.3.horizontal")
                    }
                    .accessibilityLabel("Sessions")
                }
            }
            ToolbarItem(placement: .navigationBarTrailing) {
                Button { store.createSession() } label: {
                    Image(systemName: "square.and.pencil")
                }
                .accessibilityLabel("New session")
            }
        }
    }

    private var navTitle: String {
        guard let id = store.activeSessionId else { return "Assistant" }
        return store.sessions.first(where: { $0.id == id })?.title ?? "Assistant"
    }

    private var content: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Space.s3) {
                if timeline.isEmpty {
                    EmptyStateView(
                        glyph: "text.bubble",
                        title: "Start a chat",
                        line: "Ask, or pick a starting point.",
                        actionLabel: nil,
                        action: nil
                    )
                    ForEach(examples, id: \.self) { ex in
                        Button(ex) { store.sendMessage(ex) }
                            .font(.subheadline)
                            .foregroundColor(Tokens.accent)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    ForEach(timeline) { entry in
                        switch entry.item {
                        case .message(let m):
                            MessageBubble(message: m, showGroupLabel: entry.groupLabel)
                        case .action(let a):
                            ApprovalCard(action: a)
                        }
                    }

                    if let t = store.toolStatus, t.sessionId == store.activeSessionId {
                        ToolStatusChip()
                            .padding(.top, Space.s2)
                    }
                }
            }
            .padding(.horizontal, Space.s4)
            .padding(.vertical, Space.s3)
        }
        .defaultScrollAnchor(.bottom)
    }

    private var timeline: [TimelineEntry] {
        var items: [StreamItem] = []
        let msgs = store.messages[store.activeSessionId ?? ""] ?? []
        let acts = store.actions.filter { $0.sessionId == store.activeSessionId }
        for m in msgs { items.append(.message(m)) }
        for a in acts { items.append(.action(a)) }
        items.sort { $0.seq < $1.seq }

        var result: [TimelineEntry] = []
        var lastWasAgent = false
        for item in items {
            var label = false
            var id = ""
            switch item {
            case .message(let m):
                id = m.id
                if m.role == .agent {
                    label = !lastWasAgent
                    lastWasAgent = true
                } else {
                    lastWasAgent = false
                }
            case .action(let a):
                id = a.id
                lastWasAgent = false
            }
            result.append(TimelineEntry(id: id, item: item, groupLabel: label))
        }
        return result
    }
}
