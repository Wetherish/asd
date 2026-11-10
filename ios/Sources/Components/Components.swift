import SwiftUI

// MARK: - Button

enum ButtonVariant {
    case primary, secondary, ghost, destructive
}

struct VariantButtonStyle: ButtonStyle {
    var variant: ButtonVariant = .primary
    var small: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(small ? .subheadline : .headline)
            .fontWeight(.semibold)
            .foregroundColor(textColor)
            .padding(.horizontal, small ? Space.s3 : Space.s4)
            .frame(minHeight: small ? 32 : 44)
            .background(fill(isPressed: configuration.isPressed))
            .clipShape(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.sm, style: .continuous)
                    .strokeBorder(strokeColor, lineWidth: variant == .secondary ? 1 : 0)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
    }

    private var textColor: Color {
        switch variant {
        case .primary: return Tokens.accentOn
        case .secondary: return Tokens.textPrimary
        case .ghost: return Tokens.accent
        case .destructive: return Tokens.textInverse
        }
    }

    private var strokeColor: Color {
        variant == .secondary ? Tokens.border : .clear
    }

    @ViewBuilder
    private func fill(isPressed: Bool) -> some View {
        switch variant {
        case .primary:
            Rectangle().fill(isPressed ? Tokens.accentPressed : Tokens.accent)
        case .secondary:
            Rectangle().fill(Tokens.surface)
        case .ghost:
            Rectangle().fill(Color.clear)
        case .destructive:
            Rectangle().fill(Tokens.danger)
        }
    }
}

// MARK: - Status pill

struct StatusPill: View {
    enum Tone {
        case success, warning, danger, neutral
    }

    var label: String
    var tone: Tone

    var body: some View {
        HStack(spacing: 6) {
            Circle().fill(color).frame(width: 6, height: 6)
            Text(label).font(.caption).foregroundColor(Tokens.textPrimary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(Capsule().fill(Tokens.surface))
    }

    private var color: Color {
        switch tone {
        case .success: return Tokens.success
        case .warning: return Tokens.warning
        case .danger: return Tokens.danger
        case .neutral: return Tokens.textTertiary
        }
    }
}

extension ActionState {
    var pillLabel: String {
        switch self {
        case .proposed: return "Preparing…"
        case .pending: return "Pending"
        case .editing: return "Editing"
        case .approving: return "Approving…"
        case .approved, .done: return "Approved"
        case .rejected: return "Rejected"
        case .expired: return "Expired"
        case .failed: return "Failed"
        case .undone: return "Undone"
        }
    }

    var pillTone: StatusPill.Tone {
        switch self {
        case .approved, .done: return .success
        case .failed: return .danger
        case .pending, .proposed, .editing, .approving: return .warning
        case .rejected, .expired, .undone: return .neutral
        }
    }
}

// MARK: - Quick-action chip

struct QuickActionChip: View {
    var label: String
    var icon: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: icon).font(.caption)
                Text(label).font(.subheadline)
            }
            .padding(.horizontal, 14)
            .frame(height: 36)
            .foregroundColor(Tokens.textPrimary)
            .background(
                Capsule().fill(Tokens.surface)
                    .overlay(Capsule().strokeBorder(Tokens.border))
            )
        }
    }
}

// MARK: - Empty state

struct EmptyStateView: View {
    var glyph: String
    var title: String
    var line: String?
    var actionLabel: String?
    var action: (() -> Void)?

    var body: some View {
        VStack(spacing: Space.s2) {
            Image(systemName: glyph)
                .font(.system(size: 44))
                .foregroundColor(Tokens.textTertiary)
            Text(title)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(Tokens.textPrimary)
                .multilineTextAlignment(.center)
            if let line {
                Text(line)
                    .font(.subheadline)
                    .foregroundColor(Tokens.textSecondary)
                    .multilineTextAlignment(.center)
            }
            if let actionLabel, let action {
                Button(actionLabel, action: action)
                    .buttonStyle(VariantButtonStyle(variant: .primary))
                    .padding(.top, Space.s2)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(Space.s6)
    }
}
