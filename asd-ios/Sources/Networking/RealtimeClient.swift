import Foundation

/// Typed realtime events mirroring design/03-api.md §5.
enum RealtimeEvent {
    case messageDelta(sessionId: String, messageId: String, delta: String)
    case messageDone(sessionId: String, messageId: String)
    case messageError(sessionId: String, messageId: String, error: API.ErrorBody)
    case approvalCreated(API.Approval)
    case approvalUpdated(API.Approval)
    case jobUpdated(API.Job)
    case sessionUpdated(API.Session)
    case presence(sessionId: String, people: [API.Person])
    case pong

    init?(from text: String) {
        guard let data = text.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = obj["type"] as? String else { return nil }

        if type == "pong" { self = .pong; return }
        guard let payload = obj["data"] as? [String: Any] else { return nil }

        switch type {
        case "message.delta":
            guard let sid = payload["sessionId"] as? String,
                  let mid = payload["messageId"] as? String,
                  let delta = payload["delta"] as? String else { return nil }
            self = .messageDelta(sessionId: sid, messageId: mid, delta: delta)
        case "message.done":
            guard let sid = payload["sessionId"] as? String,
                  let mid = payload["messageId"] as? String else { return nil }
            self = .messageDone(sessionId: sid, messageId: mid)
        case "message.error":
            guard let sid = payload["sessionId"] as? String,
                  let mid = payload["messageId"] as? String else { return nil }
            let err = payload["error"] as? [String: Any]
            let error = API.ErrorBody(
                code: err?["code"] as? String ?? "internal",
                message: err?["message"] as? String ?? "error",
                details: nil
            )
            self = .messageError(sessionId: sid, messageId: mid, error: error)
        case "approval.created", "approval.updated":
            guard let approval = Self.decode(payload["approval"], as: API.Approval.self) else { return nil }
            self = type == "approval.created" ? .approvalCreated(approval) : .approvalUpdated(approval)
        case "job.updated":
            guard let job = Self.decode(payload["job"], as: API.Job.self) else { return nil }
            self = .jobUpdated(job)
        case "session.updated":
            guard let session = Self.decode(payload["session"], as: API.Session.self) else { return nil }
            self = .sessionUpdated(session)
        case "presence":
            guard let sid = payload["sessionId"] as? String else { return nil }
            let people = Self.decode(payload["people"], as: [API.Person].self) ?? []
            self = .presence(sessionId: sid, people: people)
        default:
            return nil
        }
    }

    private static func decode<T: Decodable>(_ any: Any?, as type: T.Type) -> T? {
        guard let any else { return nil }
        guard let data = try? JSONSerialization.data(withJSONObject: any) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}

enum RealtimeScope: String {
    case session, job, global
}

/// WebSocket client surfacing realtime events as cancellable `AsyncStream`s.
@MainActor
final class RealtimeClient {
    private var task: URLSessionWebSocketTask?
    private let session = URLSession(configuration: .default)
    private let wsURL: URL
    private let tokenProvider: () -> String?
    private var subscriptions: [String: AsyncStream<RealtimeEvent>.Continuation] = [:]
    private var receiveTask: Task<Void, Never>?
    private var reconnectTask: Task<Void, Never>?
    private var backoffNanos: UInt64 = 1_000_000_000
    private var closed = false

    init(wsURL: URL, tokenProvider: @escaping () -> String?) {
        self.wsURL = wsURL
        self.tokenProvider = tokenProvider
    }

    func connect() {
        guard !closed, let token = tokenProvider() else { return }
        var comps = URLComponents(url: wsURL, resolvingAgainstBaseURL: false)
        comps?.queryItems = [URLQueryItem(name: "token", value: token)]
        guard let url = comps?.url else { return }

        task = session.webSocketTask(with: url)
        task?.resume()
        startReceive()
        for key in subscriptions.keys {
            guard let (scope, id) = Self.parse(key) else { continue }
            sendSubscribe(scope, id)
        }
    }

    /// Subscribes to a scope + id. The stream ends when the consumer cancels
    /// (e.g. a `.task {}` finishes), which also unsubscribes from the server.
    func events(_ scope: RealtimeScope, id: String) -> AsyncStream<RealtimeEvent> {
        let (stream, continuation) = AsyncStream<RealtimeEvent>.makeStream()
        let key = Self.key(scope, id)
        subscriptions[key] = continuation
        sendSubscribe(scope, id)
        continuation.onTermination = { @Sendable [weak self] _ in
            Task { @MainActor in
                self?.subscriptions.removeValue(forKey: key)
                self?.sendUnsubscribe(scope, id)
            }
        }
        return stream
    }

    func close() {
        closed = true
        receiveTask?.cancel()
        reconnectTask?.cancel()
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        subscriptions.removeAll()
    }

    // MARK: Internals

    private func startReceive() {
        receiveTask?.cancel()
        receiveTask = Task { [weak self] in
            guard let task = self?.task else { return }
            while !Task.isCancelled {
                do {
                    let message = try await task.receive()
                    switch message {
                    case .string(let s): self?.handle(s)
                    case .data(let d):
                        if let s = String(data: d, encoding: .utf8) { self?.handle(s) }
                    @unknown default: break
                    }
                } catch {
                    self?.scheduleReconnect()
                    break
                }
            }
        }
    }

    private func handle(_ text: String) {
        guard let event = RealtimeEvent(from: text) else { return }
        for (key, continuation) in subscriptions where Self.matches(event, key: key) {
            continuation.yield(event)
        }
    }

    private func sendSubscribe(_ scope: RealtimeScope, _ id: String) {
        send(["type": "subscribe", "data": ["scope": scope.rawValue, "id": id]])
    }

    private func sendUnsubscribe(_ scope: RealtimeScope, _ id: String) {
        send(["type": "unsubscribe", "data": ["scope": scope.rawValue, "id": id]])
    }

    private func send(_ object: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: object),
              let text = String(data: data, encoding: .utf8) else { return }
        task?.send(.string(text)) { _ in }
    }

    private func scheduleReconnect() {
        guard !closed, reconnectTask == nil else { return }
        reconnectTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: self?.backoffNanos ?? 1_000_000_000)
            guard let self else { return }
            self.backoffNanos = min(self.backoffNanos * 2, 30_000_000_000)
            self.reconnectTask = nil
            self.connect()
        }
    }

    private static func key(_ scope: RealtimeScope, _ id: String) -> String {
        "\(scope.rawValue):\(id)"
    }

    private static func parse(_ key: String) -> (RealtimeScope, String)? {
        let parts = key.split(separator: ":", maxSplits: 1).map(String.init)
        guard parts.count == 2, let scope = RealtimeScope(rawValue: parts[0]) else { return nil }
        return (scope, parts[1])
    }

    private static func matches(_ event: RealtimeEvent, key: String) -> Bool {
        guard let (scope, id) = parse(key) else { return false }
        switch scope {
        case .session:
            switch event {
            case .messageDelta(let sid, _, _), .messageDone(let sid, _), .messageError(let sid, _, _):
                return sid == id
            case .approvalCreated(let a), .approvalUpdated(let a):
                return a.sessionId == id
            case .sessionUpdated(let s):
                return s.id == id
            case .presence(let sid, _):
                return sid == id
            case .pong:
                return false
            }
        case .job:
            if case .jobUpdated(let job) = event { return job.id == id }
            return false
        case .global:
            switch event {
            case .approvalCreated, .approvalUpdated, .jobUpdated, .sessionUpdated:
                return true
            default:
                return false
            }
        }
    }
}
