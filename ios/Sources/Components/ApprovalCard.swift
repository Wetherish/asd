import SwiftUI

// MARK: - Editing subview (live inputs)

@MainActor
private struct EditCard: View {
    @EnvironmentObject var store: AppStore
    let action: Action
    @State private var fields: [String]

    init(action: Action) {
        self.action = action
        _fields = State(initialValue: action.preview.map { $0.value })
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            header
            VStack(alignment: .leading, spacing: Space.s2) {
                ForEach(action.preview.indices, id: \.self) { i in
                    let row = action.preview[i]
                    HStack(alignment: .firstTextBaseline) {
                        Text(row.label)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textTertiary)
                            .frame(width: 72, alignment: .leading)
                        TextField(row.label, text: $fields[i], axis: .vertical)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textPrimary)
                    }
                }
            }
            HStack {
                Spacer()
                Button("Cancel") { store.cancelEditAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary))
                Button("Approve edited") {
                    let edited = zip(action.preview, fields).map { PreviewRow(label: $0.label, value: $1) }
                    store.approveEditedAction(action.id, edited)
                }
                .buttonStyle(VariantButtonStyle(variant: .primary))
            }
        }
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
    }

    private var header: some View {
        HStack {
            Image(systemName: action.glyph)
                .font(.title3)
                .foregroundColor(action.destructive ? Tokens.danger : Tokens.textSecondary)
            Text(action.title)
                .font(.headline)
                .foregroundColor(Tokens.textPrimary)
            Spacer()
            StatusPill(label: "Editing", tone: .warning)
        }
    }
}

// MARK: - Approval card

@MainActor
struct ApprovalCard: View {
    @EnvironmentObject var store: AppStore
    let action: Action

    var body: some View {
        switch action.state {
        case .proposed:
            proposed
        case .pending:
            pending
        case .editing:
            EditCard(action: action)
        case .approving:
            approving
        case .approved, .done:
            approvedLine
        case .rejected, .undone:
            rejectedLine
        case .expired:
            expiredLine
        case .failed:
            failed
        }
    }

    // MARK: Proposed (skeleton)

    private var proposed: some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            HStack {
                Image(systemName: action.glyph)
                    .font(.title3)
                    .foregroundColor(Tokens.textTertiary)
                Text(action.title)
                    .font(.headline)
                    .foregroundColor(Tokens.textPrimary)
                Spacer()
            }
            ForEach(0..<3, id: \.self) { _ in
                RoundedRectangle(cornerRadius: 4)
                    .fill(Tokens.surfaceSunken)
                    .frame(height: 14)
            }
            Text("Preparing…")
                .font(.footnote)
                .foregroundColor(Tokens.textTertiary)
        }
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
    }

    // MARK: Pending

    private var pending: some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            HStack {
                Image(systemName: action.glyph)
                    .font(.title3)
                    .foregroundColor(action.destructive ? Tokens.danger : Tokens.textSecondary)
                Text(action.title)
                    .font(.headline)
                    .foregroundColor(Tokens.textPrimary)
                Spacer()
                StatusPill(label: action.state.pillLabel, tone: action.state.pillTone)
            }

            VStack(alignment: .leading, spacing: Space.s2) {
                ForEach(action.preview) { row in
                    HStack(alignment: .top) {
                        Text(row.label)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textTertiary)
                            .frame(width: 72, alignment: .leading)
                        Text(row.value)
                            .font(.subheadline)
                            .foregroundColor(Tokens.textPrimary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            Text(action.consequence)
                .font(.footnote)
                .foregroundColor(action.destructive ? Tokens.danger : Tokens.textTertiary)

            HStack {
                Spacer()
                Button("Reject") { store.rejectAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary))
                Button("Edit") { store.editAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary))
                Button(action.destructive ? action.title : "Approve") { store.approveAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: action.destructive ? .destructive : .primary))
            }
        }
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Approval needed. \(action.title). \(action.consequence)")
    }

    // MARK: Approving

    private var approving: some View {
        VStack(alignment: .leading, spacing: Space.s2) {
            Text("Approving…")
                .font(.headline)
                .foregroundColor(Tokens.textPrimary)
            if action.approvingLong {
                Text("Still working. Taking longer than usual.")
                    .font(.footnote)
                    .foregroundColor(Tokens.textTertiary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.surface))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
    }

    // MARK: Approved / done

    private var approvedLine: some View {
        HStack {
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(Tokens.success)
            Text(action.resultLine ?? "Done")
                .font(.subheadline)
                .foregroundColor(Tokens.textPrimary)
            Spacer()
            if action.undoUntil != nil {
                Button("Undo") { store.undoAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
            } else {
                Button("View in activity") { store.selectedTab = .activity }
                    .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
            }
        }
        .padding(.vertical, Space.s2)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Approved. \(action.resultLine ?? "Done").")
    }

    // MARK: Rejected / undone

    private var rejectedLine: some View {
        HStack {
            StatusPill(label: action.state.pillLabel, tone: .neutral)
            Text(action.title)
                .font(.subheadline)
                .foregroundColor(Tokens.textSecondary)
            Spacer()
            Button("Ask again") { store.askAgainAction(action.id) }
                .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
        }
        .padding(.vertical, Space.s2)
        .opacity(0.6)
    }

    // MARK: Expired

    private var expiredLine: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(Tokens.warning)
            Text("Expired")
                .font(.subheadline)
                .foregroundColor(Tokens.textSecondary)
            Spacer()
            Button("Ask again") { store.askAgainAction(action.id) }
                .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
        }
        .padding(.vertical, Space.s2)
    }

    // MARK: Failed

    private var failed: some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            HStack {
                Image(systemName: action.glyph)
                    .font(.title3)
                    .foregroundColor(Tokens.danger)
                Text(action.title)
                    .font(.headline)
                    .foregroundColor(Tokens.textPrimary)
                Spacer()
                StatusPill(label: "Failed", tone: .danger)
            }
            Text(action.cause ?? "Couldn't complete this action.")
                .font(.footnote)
                .foregroundColor(Tokens.danger)
            HStack {
                Spacer()
                Button("Retry") { store.askAgainAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary, small: true))
                Button("Edit") { store.editAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary, small: true))
                Button("Dismiss") { store.rejectAction(action.id) }
                    .buttonStyle(VariantButtonStyle(variant: .secondary, small: true))
            }
        }
        .padding(Space.s4)
        .background(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).fill(Tokens.dangerTint))
        .overlay(RoundedRectangle(cornerRadius: Radius.md, style: .continuous).strokeBorder(Tokens.border))
    }
}
