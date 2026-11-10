import SwiftUI

// MARK: - Connection row (02 §9)

@MainActor
struct ConnectionRow: View {
    @EnvironmentObject var store: AppStore
    let connection: Connection
    var onOpen: () -> Void

    var body: some View {
        HStack(spacing: Space.s3) {
            Image(systemName: connection.glyph)
                .font(.title3)
                .foregroundColor(Tokens.textSecondary)
                .frame(width: 28, height: 28)
                .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.surface))

            VStack(alignment: .leading, spacing: 2) {
                Text(connection.name)
                    .font(.headline)
                    .foregroundColor(Tokens.textPrimary)
                Text(scopeLine)
                    .font(.footnote)
                    .foregroundColor(Tokens.textTertiary)
                    .lineLimit(1)
            }
            Spacer()
            trailing
        }
        .padding(.vertical, Space.s3)
        .contentShape(Rectangle())
        .onTapGesture(perform: handleTap)
    }

    private var scopeLine: String {
        switch connection.state {
        case .connected:
            let shown = connection.scopes.prefix(2).joined(separator: " · ")
            let extra = connection.scopes.count > 2 ? " · +\(connection.scopes.count - 2) more" : ""
            return shown + extra
        case .expired:
            return "Access expired"
        case .error:
            return connection.cause ?? "Something went wrong"
        default:
            return "Not connected"
        }
    }

    @ViewBuilder
    private var trailing: some View {
        switch connection.state {
        case .disconnected:
            Button("Connect") { store.connectService(connection.id) }
                .buttonStyle(VariantButtonStyle(variant: .primary, small: true))
        case .connecting:
            Text("Connecting…")
                .font(.subheadline)
                .foregroundColor(Tokens.textTertiary)
        case .connected:
            Image(systemName: "chevron.right")
                .font(.footnote)
                .foregroundColor(Tokens.textTertiary)
        case .expired:
            Button("Reconnect") { store.connectService(connection.id) }
                .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
                .foregroundColor(Tokens.warning)
        case .error:
            Button("Retry") { store.connectService(connection.id) }
                .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
                .foregroundColor(Tokens.danger)
        }
    }

    private func handleTap() {
        if connection.state == .connected {
            onOpen()
        }
    }
}

// MARK: - Log entry (03 §Screen 4 timeline)

@MainActor
struct LogEntryView: View {
    @EnvironmentObject var store: AppStore
    let entry: LogEntry
    var isLast: Bool = false

    @State private var expanded = false

    var body: some View {
        HStack(alignment: .top, spacing: Space.s2) {
            rail

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: Space.s2) {
                    Text(time)
                        .font(.caption)
                        .foregroundColor(Tokens.textTertiary)
                    Text(entry.title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(Tokens.textPrimary)
                    Text("[\(entry.tool)]")
                        .font(.caption)
                        .foregroundColor(Tokens.textTertiary)
                    Spacer()
                    Text(statusLabel)
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(statusColor)
                }
                Text(entry.result)
                    .font(.footnote)
                    .foregroundColor(entry.state == .failed ? Tokens.danger : Tokens.textSecondary)
                    .lineLimit(expanded ? nil : 1)

                if expanded {
                    detail
                }

                if entry.state == .failed && !expanded {
                    Button("Retry") { store.retryLastFailed(entry.sessionId) }
                        .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                withAnimation(.easeInOut(duration: Motion.d1)) { expanded.toggle() }
            } label: {
                Image(systemName: expanded ? "chevron.up" : "chevron.down")
                    .font(.footnote)
                    .foregroundColor(Tokens.textTertiary)
                    .frame(width: 28, height: 28)
            }
            .accessibilityLabel(expanded ? "Hide details" : "Show details")
        }
        .padding(.vertical, Space.s2)
        .padding(.horizontal, Space.s2)
        .background(entry.state == .failed ? Tokens.dangerTint : .clear)
        .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
    }

    private var rail: some View {
        VStack(spacing: 0) {
            dot
                .padding(.top, 5)
            if !isLast {
                Rectangle()
                    .fill(Tokens.border)
                    .frame(width: 1)
                    .frame(maxHeight: .infinity)
            }
        }
        .frame(width: 16)
    }

    @ViewBuilder
    private var dot: some View {
        if entry.state == .running {
            Circle().stroke(Tokens.borderStrong, lineWidth: 1).frame(width: 8, height: 8)
        } else {
            Circle().fill(dotColor).frame(width: 8, height: 8)
        }
    }

    private var dotColor: Color {
        switch entry.state {
        case .done: return Tokens.success
        case .failed: return Tokens.danger
        case .running: return .clear
        case .blocked: return Tokens.warning
        case .rejected: return Tokens.textTertiary
        }
    }

    private var statusLabel: String {
        switch entry.state {
        case .done: return "Done"
        case .failed: return "Failed"
        case .running: return "Running…"
        case .blocked: return "Waiting for approval"
        case .rejected: return "You rejected this"
        }
    }

    private var statusColor: Color {
        switch entry.state {
        case .done: return Tokens.success
        case .failed: return Tokens.danger
        case .blocked: return Tokens.warning
        default: return Tokens.textTertiary
        }
    }

    private var time: String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: entry.ts)
    }

    private var detail: some View {
        VStack(alignment: .leading, spacing: Space.s1) {
            HStack {
                Text("Duration").font(.caption).foregroundColor(Tokens.textTertiary)
                Spacer()
                Text("1.2s").font(.caption).foregroundColor(Tokens.textSecondary)
            }
            HStack {
                Text("Request ID").font(.caption).foregroundColor(Tokens.textTertiary)
                Spacer()
                Text("req_8f2a91c3").font(.caption).foregroundColor(Tokens.textSecondary)
            }
        }
        .padding(Space.s2)
        .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.surfaceSunken))
    }
}
