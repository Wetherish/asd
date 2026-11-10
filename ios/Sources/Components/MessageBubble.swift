import SwiftUI

// MARK: - Tool-status chip

@MainActor
struct ToolStatusChip: View {
    @EnvironmentObject var store: AppStore

    var body: some View {
        if let t = store.toolStatus {
            HStack(spacing: 8) {
                Image(systemName: glyph(t.state))
                    .font(.subheadline)
                    .foregroundColor(glyphColor(t.state))
                Text(t.label)
                    .font(.subheadline)
                    .foregroundColor(Tokens.textSecondary)
                if t.total > 1 {
                    Text("\(t.step) of \(t.total)")
                        .font(.footnote)
                        .foregroundColor(Tokens.textTertiary)
                }
                Spacer()
            }
            .padding(.horizontal, Space.s3)
            .padding(.vertical, Space.s2)
            .accessibilityElement(children: .combine)
        }
    }

    private func glyph(_ s: ToolState) -> String {
        switch s {
        case .running, .queued: return "clock"
        case .done: return "checkmark.circle.fill"
        case .failed: return "xmark.octagon.fill"
        case .blocked: return "exclamationmark.triangle.fill"
        }
    }

    private func glyphColor(_ s: ToolState) -> Color {
        switch s {
        case .done: return Tokens.success
        case .failed: return Tokens.danger
        case .blocked: return Tokens.warning
        default: return Tokens.textTertiary
        }
    }
}

// MARK: - Voice waveform

struct VoiceWaveform: View {
    var active: Bool

    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<32, id: \.self) { i in
                RoundedRectangle(cornerRadius: 1)
                    .fill(active ? Tokens.accent : Tokens.textTertiary)
                    .frame(width: 2, height: height(i))
            }
        }
        .frame(height: 24)
    }

    private func height(_ i: Int) -> CGFloat {
        let v = sin(Double(i) * 12.9898) * 43758.5453
        let frac = v - floor(v)
        return 4 + CGFloat(frac) * 20
    }
}

// MARK: - Message bubble

@MainActor
struct MessageBubble: View {
    @EnvironmentObject var store: AppStore
    let message: Message
    var showGroupLabel: Bool = false

    var body: some View {
        switch message.role {
        case .user:
            userBubble
        case .agent:
            agentContent
        case .system:
            EmptyView()
        }
    }

    private var userBubble: some View {
        HStack {
            Spacer(minLength: 60)
            Text(message.text ?? "")
                .font(.body)
                .foregroundColor(Tokens.accentOn)
                .padding(.horizontal, Space.s4)
                .padding(.vertical, Space.s3)
                .background(
                    UnevenRoundedRectangle(topLeadingRadius: Radius.md, bottomLeadingRadius: Radius.md, bottomTrailingRadius: Radius.sm, topTrailingRadius: Radius.md)
                        .fill(Tokens.accent)
                )
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("You said: \(message.text ?? "")")
    }

    @ViewBuilder
    private var agentContent: some View {
        VStack(alignment: .leading, spacing: Space.s2) {
            if showGroupLabel {
                Text("Assistant")
                    .font(.footnote)
                    .foregroundColor(Tokens.textTertiary)
            }

            switch message.kind {
            case .dashboardCard:
                dashboardCard
            case .error:
                errorBlock
            case .text:
                HStack(alignment: .top, spacing: 0) {
                    Text(message.text ?? "")
                        .font(.body)
                        .foregroundColor(Tokens.textPrimary)
                    if message.status == .streaming {
                        RoundedRectangle(cornerRadius: 1)
                            .fill(Tokens.accent)
                            .frame(width: 2, height: 18)
                            .padding(.leading, 2)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var dashboardCard: some View {
        Button {
            if let id = message.dashboardId {
                store.dashboardId = id
            }
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(message.dashboardName ?? "Dashboard")
                        .font(.headline)
                        .foregroundColor(Tokens.textPrimary)
                    if let meta = message.dashboardMeta {
                        Text(meta)
                            .font(.footnote)
                            .foregroundColor(Tokens.textTertiary)
                    }
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.footnote)
                    .foregroundColor(Tokens.textTertiary)
            }
            .padding(Space.s4)
            .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
            .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
        }
        .accessibilityLabel("\(message.dashboardName ?? ""). \(message.dashboardMeta ?? "")")
    }

    private var errorBlock: some View {
        HStack(alignment: .top, spacing: Space.s2) {
            Image(systemName: "xmark.octagon.fill")
                .font(.subheadline)
                .foregroundColor(Tokens.danger)
            Text(message.text ?? "")
                .font(.body)
                .foregroundColor(Tokens.textPrimary)
            Spacer()
            if message.retry {
                Button("Retry") { store.retryLastFailed(message.sessionId) }
                    .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
            }
        }
        .padding(Space.s3)
        .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.dangerTint))
    }
}
