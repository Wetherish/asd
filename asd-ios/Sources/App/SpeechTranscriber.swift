import AVFoundation
import Combine
import Speech

/// Wraps Apple's on-device speech recognition (`SFSpeechRecognizer` + `AVAudioEngine`)
/// into a small observable for the Talk overlay. Streams partial results as the
/// user speaks, exposes availability / permission state, and falls back to typed
/// input when recognition is unavailable.
@MainActor
final class SpeechTranscriber: NSObject, ObservableObject {
    @Published private(set) var transcript = ""
    @Published private(set) var isListening = false
    @Published private(set) var isUnavailable = false
    @Published private(set) var permissionDenied = false

    private let audioEngine = AVAudioEngine()
    private let recognizer: SFSpeechRecognizer?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?

    override init() {
        recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
        super.init()
        recognizer?.delegate = self
    }

    func start() {
        guard task == nil else { return }
        SFSpeechRecognizer.requestAuthorization { status in
            Task { @MainActor in
                guard status == .authorized else {
                    self.permissionDenied = status == .denied
                    self.isUnavailable = true
                    return
                }
                self.begin()
            }
        }
    }

    func stop() {
        task?.finish()
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        request = nil
        task = nil
        isListening = false
    }

    private func begin() {
        guard let recognizer, recognizer.isAvailable else {
            isUnavailable = true
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        self.request = request

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.record, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            isUnavailable = true
            return
        }

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            isUnavailable = true
            return
        }

        isListening = true

        task = recognizer.recognitionTask(with: request) { [weak self] result, error in
            let text = result?.bestTranscription.formattedString ?? ""
            let finished = result?.isFinal ?? false || error != nil
            Task { @MainActor in
                guard let self else { return }
                self.transcript = text
                if finished { self.isListening = false }
            }
        }
    }
}

extension SpeechTranscriber: SFSpeechRecognizerDelegate {
    nonisolated func speechRecognizer(_ speechRecognizer: SFSpeechRecognizer, availabilityDidChange available: Bool) {
        Task { @MainActor in
            self.isUnavailable = !available
        }
    }
}
