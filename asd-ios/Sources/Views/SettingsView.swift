import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @AppStorage("appearance") private var appearanceRaw = Appearance.system.rawValue

    @State private var notifyJob = true
    @State private var notifyApproval = true
    @State private var notifyLive = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Alex").font(.serifTitle(18))
                            Text("alex@example.com").font(.label(11)).foregroundColor(.text3)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
                    }
                    .cardStyle()

                    SectionLabel(text: "Appearance")
                    Picker("Appearance", selection: $appearanceRaw) {
                        Text("Light").tag(Appearance.light.rawValue)
                        Text("Dark").tag(Appearance.dark.rawValue)
                        Text("Auto").tag(Appearance.system.rawValue)
                    }
                    .pickerStyle(.segmented)
                    .tint(.accent)

                    SectionLabel(text: "Assistant")
                    row("Default model", value: "Claude Sonnet 4.5")
                    row("Approval rule", value: "Ask first")

                    SectionLabel(text: "Notifications")
                    toggle("Job finished", isOn: $notifyJob)
                    toggle("Approval needed", isOn: $notifyApproval)
                    toggle("Live Activity", isOn: $notifyLive)

                    SectionLabel(text: "Connections")
                    row("Connections", value: "3 connected")
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
            .background(Color.paper.ignoresSafeArea())
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.label(11)).tracking(1.2).textCase(.uppercase)
                        .foregroundColor(.accentText)
                }
            }
        }
    }

    private func row(_ title: String, value: String) -> some View {
        HStack {
            Text(title).font(.serifTitle(17))
            Spacer()
            Text(value).font(.label(12)).foregroundColor(.text2)
            Image(systemName: "chevron.right").font(.system(size: 13)).foregroundColor(.text3)
        }
        .cardStyle()
    }

    private func toggle(_ title: String, isOn: Binding<Bool>) -> some View {
        HStack {
            Text(title).font(.serifTitle(17))
            Spacer()
            Toggle("", isOn: isOn).labelsHidden().tint(.accent)
        }
        .cardStyle()
    }
}
