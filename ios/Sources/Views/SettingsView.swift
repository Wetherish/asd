import SwiftUI

@MainActor
struct SettingsView: View {
    @EnvironmentObject var store: AppStore
    @State private var modelOpen = false
    @State private var deleteOpen = false

    private let explainers = [
        "always": "Asks before every action that changes something.",
        "sending": "Asks before sending messages or deleting. Read-only runs freely.",
        "readonly": "Reads run freely. Everything else still asks.",
    ]

    var body: some View {
        List {
            Section("Agent") {
                Button { modelOpen = true } label: {
                    HStack {
                        Text("Model")
                        Spacer()
                        Text(store.settings.model).foregroundColor(Tokens.textSecondary)
                        Image(systemName: "chevron.right").font(.caption).foregroundColor(Tokens.textTertiary)
                    }
                }
                .foregroundColor(Tokens.textPrimary)

                VStack(alignment: .leading, spacing: Space.s2) {
                    Picker("Approval rules", selection: approvalRule) {
                        Text("Always ask").tag("always")
                        Text("Sending only").tag("sending")
                        Text("Read-only").tag("readonly")
                    }
                    .pickerStyle(.segmented)
                    .labelsHidden()
                    Text(explainers[store.settings.approvalRule] ?? "")
                        .font(.footnote)
                        .foregroundColor(Tokens.textTertiary)
                }
                .padding(.vertical, Space.s2)
            }

            Section("Notifications") {
                Toggle("Task finished", isOn: $store.settings.taskFinished)
                Toggle("Approval needed", isOn: $store.settings.approvalNeeded)
                Toggle("Failures", isOn: $store.settings.failures)
            }

            Section("Appearance") {
                Picker("Theme", selection: theme) {
                    Text("System").tag(Theme.system)
                    Text("Light").tag(Theme.light)
                    Text("Dark").tag(Theme.dark)
                }
            }

            Section("Connections") {
                NavigationLink { ConnectionsView() } label: {
                    Text("Connections")
                }
            }

            Section("Data") {
                Picker("Keep activity for", selection: retention) {
                    Text("30 days").tag(30)
                    Text("90 days").tag(90)
                    Text("180 days").tag(180)
                }
                Button("Delete all activity", role: .destructive) {
                    deleteOpen = true
                }
            }
        }
        .navigationTitle("Settings")
        .navigationBarTitleDisplayMode(.large)
        .sheet(isPresented: $modelOpen) { ModelSheet() }
        .sheet(isPresented: $deleteOpen) { DeleteConfirmSheet() }
    }

    private var approvalRule: Binding<String> {
        Binding(get: { store.settings.approvalRule }, set: { store.settings.approvalRule = $0 })
    }

    private var retention: Binding<Int> {
        Binding(get: { store.settings.retentionDays }, set: { store.settings.retentionDays = $0 })
    }

    private var theme: Binding<Theme> {
        Binding(get: { store.theme }, set: { store.theme = $0 })
    }
}

// MARK: - Model sheet

@MainActor
private struct ModelSheet: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) private var dismiss

    private let models: [(id: String, desc: String)] = [
        ("Balanced", "Best for most tasks"),
        ("Fast", "Quicker, less thorough"),
        ("Thorough", "Slower, most capable"),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s3) {
            Text("Model").font(.title2).fontWeight(.semibold)
            ForEach(models, id: \.id) { m in
                Button {
                    store.settings.model = m.id
                    dismiss()
                } label: {
                    HStack {
                        Image(systemName: store.settings.model == m.id ? "checkmark.circle.fill" : "circle")
                            .foregroundColor(store.settings.model == m.id ? Tokens.accent : Tokens.textTertiary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(m.id).font(.headline).foregroundColor(Tokens.textPrimary)
                            Text(m.desc).font(.footnote).foregroundColor(Tokens.textTertiary)
                        }
                        Spacer()
                    }
                    .padding(Space.s3)
                    .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.surface))
                }
            }
            Text("Changes apply to new messages.")
                .font(.footnote)
                .foregroundColor(Tokens.textTertiary)
        }
        .padding(Space.s6)
        .presentationDetents([.medium])
    }
}

// MARK: - Delete activity sheet

@MainActor
private struct DeleteConfirmSheet: View {
    @EnvironmentObject var store: AppStore
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: Space.s4) {
            Text("Delete all activity?")
                .font(.title2)
                .fontWeight(.semibold)
            Text("This clears the log. It can't be undone.")
                .font(.footnote)
                .foregroundColor(Tokens.textSecondary)
            HStack {
                Spacer()
                Button("Cancel") { dismiss() }
                    .buttonStyle(VariantButtonStyle(variant: .secondary))
                Button("Delete all") {
                    store.logs.removeAll()
                    dismiss()
                }
                .buttonStyle(VariantButtonStyle(variant: .destructive))
            }
        }
        .padding(Space.s6)
        .presentationDetents([.medium])
    }
}
