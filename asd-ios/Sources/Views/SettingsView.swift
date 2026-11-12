import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @AppStorage("appearance") private var appearanceRaw = Appearance.system.rawValue

    @State private var notifyJob = true
    @State private var notifyApproval = true
    @State private var notifyLive = true

    // LLM config
    @State private var provider = "openai"
    @State private var model = ""
    @State private var baseUrl = ""
    @State private var apiKey = ""
    @State private var apiKeySet = false
    @State private var saving = false
    @State private var saved = false
    @State private var testing = false
    @State private var testResult: API.TestResult?

    private let providers = ["openai", "anthropic", "deepseek", "openrouter", "openai-compatible"]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(store.me?.name ?? "Alex").font(.serifTitle(18))
                            Text(store.me?.email ?? "alex@asd.app").font(.label(11)).foregroundColor(.text3)
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

                    SectionLabel(text: "Model")
                    VStack(alignment: .leading, spacing: 12) {
                        Picker("Provider", selection: $provider) {
                            ForEach(providers, id: \.self) { p in
                                Text(displayName(p)).tag(p)
                            }
                        }
                        .pickerStyle(.menu)

                        TextField("Model", text: $model)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                        if provider == "openai-compatible" {
                            TextField("Base URL", text: $baseUrl)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                        }

                        SecureField(apiKeySet ? "API key (already set)" : "API key", text: $apiKey)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                        HStack(spacing: 8) {
                            Button(saving ? "Saving…" : "Save") { save() }
                                .buttonStyle(PrimaryButtonStyle())
                            Button(testing ? "Testing…" : "Test key") { test() }
                                .buttonStyle(GhostButtonStyle())
                            if saved {
                                Text("Saved").font(.label(11)).foregroundColor(.success)
                            }
                        }
                        if let result = testResult {
                            Text("\(result.ok ? "Connected — " : "Failed — ")\(result.message)")
                                .font(.label(11))
                                .foregroundColor(result.ok ? .success : .danger)
                        }
                    }
                    .cardStyle()

                    SectionLabel(text: "Assistant")
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
        .task { await loadSettings() }
    }

    private func displayName(_ id: String) -> String {
        switch id {
        case "openai": return "OpenAI"
        case "anthropic": return "Anthropic"
        case "deepseek": return "DeepSeek"
        case "openrouter": return "OpenRouter"
        case "openai-compatible": return "OpenAI-compatible"
        default: return id
        }
    }

    private func loadSettings() async {
        if let s = try? await store.client.getSettings() {
            provider = s.provider
            model = s.model
            baseUrl = s.baseUrl
            apiKeySet = s.apiKeySet
        }
    }

    private func save() {
        Task {
            saving = true
            saved = false
            _ = try? await store.client.updateSettings(
                API.UpdateSettingsInput(
                    provider: provider,
                    model: model.isEmpty ? nil : model,
                    apiKey: apiKey.isEmpty ? nil : apiKey,
                    baseUrl: baseUrl.isEmpty ? nil : baseUrl
                )
            )
            apiKey = ""
            await loadSettings()
            saving = false
            saved = true
        }
    }

    private func test() {
        Task {
            testing = true
            testResult = nil
            let result = try? await store.client.testSettings(
                API.UpdateSettingsInput(
                    provider: provider,
                    model: model.isEmpty ? nil : model,
                    apiKey: apiKey.isEmpty ? nil : apiKey,
                    baseUrl: baseUrl.isEmpty ? nil : baseUrl
                )
            )
            testResult = result
            testing = false
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
