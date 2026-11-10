import SwiftUI

@MainActor
struct Composer: View {
    @EnvironmentObject var store: AppStore

    @State private var text = ""
    @State private var recording = false
    @FocusState private var focused: Bool

    private let chips: [(label: String, icon: String, text: String)] = [
        ("New event", "plus", "Schedule lunch Friday at 1pm"),
        ("Send message", "envelope", "Message Anna that I'm running late"),
        ("Dashboard", "chart.bar", "Create a dashboard of my weekly spending"),
        ("Check calendar", "calendar", "Check my calendar this week"),
        ("Summarise", "text.bubble", "Summarise my week"),
    ]

    private var hasText: Bool { !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }

    var body: some View {
        VStack(spacing: Space.s2) {
            if store.toolStatus == nil && !recording {
                quickChips
            }

            if recording {
                recordingBar
            } else {
                inputBar
            }
        }
        .padding(.horizontal, Space.s4)
        .padding(.vertical, Space.s2)
        .background(Tokens.canvas)
        .overlay(Divider(), alignment: .top)
    }

    private var quickChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Space.s2) {
                ForEach(chips, id: \.label) { chip in
                    QuickActionChip(label: chip.label, icon: chip.icon) {
                        send(chip.text)
                    }
                }
            }
        }
    }

    private var inputBar: some View {
        HStack(alignment: .bottom, spacing: Space.s2) {
            Button { recording = true } label: {
                Image(systemName: "mic")
                    .font(.title3)
                    .foregroundColor(Tokens.textSecondary)
                    .frame(width: 32, height: 32)
            }
            .accessibilityLabel("Dictate a message")

            TextField("Ask or tell the agent…", text: $text, axis: .vertical)
                .focused($focused)
                .lineLimit(1...5)
                .padding(.horizontal, Space.s3)
                .padding(.vertical, Space.s2)
                .background(RoundedRectangle(cornerRadius: Radius.sm, style: .continuous).fill(Tokens.surfaceSunken))
                .submitLabel(.send)
                .onSubmit(submit)
                .accessibilityLabel("Message the assistant")

            if hasText {
                Button { send(text) } label: {
                    Image(systemName: "paperplane.fill")
                        .font(.body)
                        .foregroundColor(Tokens.accentOn)
                        .frame(width: 32, height: 32)
                        .background(Circle().fill(Tokens.accent))
                }
                .accessibilityLabel("Send message")
            }
        }
    }

    private var recordingBar: some View {
        HStack(spacing: Space.s3) {
            VoiceWaveform(active: true)
            Text("Listening")
                .font(.subheadline)
                .foregroundColor(Tokens.textSecondary)
            Spacer()
            Button("Cancel") { recording = false }
                .buttonStyle(VariantButtonStyle(variant: .ghost, small: true))
        }
        .frame(height: 44)
        .onAppear {
            Task {
                try? await Task.sleep(nanoseconds: 1_400_000_000)
                let transcript = "Create a dashboard of my weekly spending"
                text = hasText ? text + " " + transcript : transcript
                recording = false
            }
        }
    }

    private func submit() {
        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { return }
        send(value)
    }

    private func send(_ value: String) {
        store.sendMessage(value)
        text = ""
    }
}
