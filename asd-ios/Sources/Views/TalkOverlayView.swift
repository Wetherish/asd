import Foundation
import SwiftUI

/// Talk (voice) — dark immersive overlay. Opens on Home ("Talk" button) or from
/// the session composer (mic). Speech is transcribed on-device via
/// `SpeechTranscriber`; the transcript is handed back through `onDone` with an
/// optional lead-agent destination.
///
/// - `.home`: pick a lead agent, Done creates a session from the transcript.
/// - `.composer`: destination is fixed to the current session, Done sends.
///
/// Falls back to a text editor when recognition is unavailable or the microphone
/// is denied, so the flow still works.
struct TalkOverlayView: View {
    enum Mode { case home, composer }

    @Environment(\.dismiss) private var dismiss
    @StateObject private var transcriber = SpeechTranscriber()

    let mode: Mode
    let agents: [API.Agent]
    let destinationTitle: String?
    let onDone: (String, String?) async -> Void

    @State private var leadAgentId = ""
    @State private var typed = ""
    @State private var working = false

    private var canType: Bool { transcriber.isUnavailable || transcriber.permissionDenied }
    private var text: String {
        let source = canType ? typed : transcriber.transcript
        return source.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            stage
            footer
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(hex: 0x141210).ignoresSafeArea())
        .foregroundColor(Color(hex: 0xEDE9E2))
        .preferredColorScheme(.dark)
        .onAppear {
            if leadAgentId.isEmpty { leadAgentId = agents.first?.id ?? "" }
            transcriber.start()
        }
        .onDisappear { transcriber.stop() }
    }

    // MARK: Header

    private var header: some View {
        HStack {
            Button { cancel() } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 17))
                    .foregroundColor(Color(hex: 0xB5AEA0))
                    .frame(width: 34, height: 34)
            }
            Spacer()
            Text("Voice").font(.label(13)).tracking(2.2).textCase(.uppercase).foregroundColor(Color(hex: 0xB5AEA0))
            Spacer()
            Color.clear.frame(width: 34, height: 34)
        }
        .padding(.horizontal, 16)
        .padding(.top, 16)
    }

    // MARK: Stage (waveform + transcript)

    private var stage: some View {
        VStack(spacing: 22) {
            Spacer()

            waveform

            Text(transcriber.isListening ? "Listening…" : "Tap to speak")
                .font(.label(11)).tracking(2.2).textCase(.uppercase)
                .foregroundColor(Color(hex: 0x857E72))

            if canType {
                TextEditor(text: $typed)
                    .font(.text(15))
                    .frame(height: 140)
                    .padding(10)
                    .scrollContentBackground(.hidden)
                    .background(Color(hex: 0x1E1B17))
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                            .strokeBorder(Color(hex: 0x34302A), lineWidth: 1)
                    )
                    .padding(.horizontal, 24)
            } else {
                Text(transcriber.transcript.isEmpty ? "Say what you need…" : transcriber.transcript)
                    .font(.system(size: 26, weight: .light, design: .serif).italic())
                    .foregroundColor(transcriber.transcript.isEmpty ? Color(hex: 0x857E72) : Color(hex: 0xEDE9E2))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 320)
            }

            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private var waveform: some View {
        TimelineView(.animation) { timeline in
            let phase = timeline.date.timeIntervalSinceReferenceDate
            HStack(spacing: 3) {
                ForEach(0..<24, id: \.self) { i in
                    let height = transcriber.isListening
                        ? 8 + 56 * abs(sin(phase * 3.0 + Double(i) * 0.55))
                        : 8.0
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(hex: 0x4FD1C5))
                        .frame(width: 3, height: height)
                }
            }
            .frame(height: 72)
        }
    }

    // MARK: Footer (destination + actions)

    private var footer: some View {
        VStack(alignment: .leading, spacing: 0) {
            if mode == .home {
                Text("To").font(.label(10)).tracking(2).textCase(.uppercase)
                    .foregroundColor(Color(hex: 0x857E72)).padding(.bottom, 8)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(agents) { agent in
                            Button { leadAgentId = agent.id } label: {
                                Text(agent.name)
                                    .font(.label(11))
                                    .foregroundColor(leadAgentId == agent.id ? Color(hex: 0x0C1F1D) : Color(hex: 0xB5AEA0))
                                    .padding(.horizontal, 14).padding(.vertical, 9)
                                    .background(leadAgentId == agent.id ? Color(hex: 0x4FD1C5) : Color(hex: 0x1E1B17))
                                    .clipShape(Capsule())
                                    .overlay(
                                        Capsule().strokeBorder(
                                            Color(hex: 0x34302A),
                                            lineWidth: leadAgentId == agent.id ? 0 : 1
                                        )
                                    )
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            } else {
                Text("To · \(destinationTitle ?? "Session")")
                    .font(.label(10)).tracking(2).textCase(.uppercase)
                    .foregroundColor(Color(hex: 0x857E72))
            }

            HStack(spacing: 8) {
                Button("Cancel") { cancel() }
                    .buttonStyle(TalkGhostStyle())
                    .frame(maxWidth: .infinity)
                Button(working ? "Working…" : "Done") { done() }
                    .buttonStyle(TalkPrimaryStyle())
                    .frame(maxWidth: .infinity)
                    .disabled(text.isEmpty || working)
            }
            .padding(.top, 16)
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 24)
    }

    // MARK: Actions

    private func cancel() {
        transcriber.stop()
        dismiss()
    }

    private func done() {
        guard !text.isEmpty, !working else { return }
        working = true
        transcriber.stop()
        Task {
            await onDone(text, mode == .home ? leadAgentId : nil)
            working = false
            dismiss()
        }
    }
}

// MARK: - Button styles (dark)

private struct TalkPrimaryStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.label(11)).tracking(1.2).textCase(.uppercase)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .foregroundColor(Color(hex: 0x0C1F1D))
            .background(Color(hex: 0x4FD1C5))
            .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
            .opacity(configuration.isPressed ? 0.85 : 1)
    }
}

private struct TalkGhostStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.label(11)).tracking(1.2).textCase(.uppercase)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity)
            .foregroundColor(Color(hex: 0xEDE9E2))
            .background(Color(hex: 0x26221D))
            .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 11, style: .continuous)
                    .strokeBorder(Color(hex: 0x34302A), lineWidth: 1)
            )
    }
}
