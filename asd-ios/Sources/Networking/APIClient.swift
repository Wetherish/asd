import Foundation

/// Thread-safe token holder, persisted to UserDefaults (mirrors the web client's
/// localStorage token so a login survives relaunch).
final class TokenStore {
    private let lock = NSLock()
    private let key = "asd.token"
    private let defaults = UserDefaults.standard

    var token: String? {
        get { lock.lock(); defer { lock.unlock() }; return defaults.string(forKey: key) }
        set {
            lock.lock(); defer { lock.unlock() }
            if let value = newValue { defaults.set(value, forKey: key) }
            else { defaults.removeObject(forKey: key) }
        }
    }
}

/// REST + WebSocket client implementing design/03-api.md, mirroring the web
/// `ApiClient` method-for-method.
@MainActor
final class APIClient {
    let http: HTTPClient
    let realtime: RealtimeClient
    private let tokenStore: TokenStore

    init(baseURL: URL, wsURL: URL, tokenStore: TokenStore = TokenStore()) {
        self.tokenStore = tokenStore
        self.http = HTTPClient(baseURL: baseURL, tokenProvider: { tokenStore.token })
        self.realtime = RealtimeClient(wsURL: wsURL, tokenProvider: { tokenStore.token })
    }

    // MARK: Auth

    var hasToken: Bool { tokenStore.token != nil }

    func login(email: String, password: String) async throws -> API.Person {
        struct Body: Encodable { let email: String; let password: String }
        let res: API.AuthSessionResponse = try await http.post("/auth/login", body: Body(email: email, password: password))
        tokenStore.token = res.token
        return res.user
    }

    func signup(email: String, password: String) async throws -> API.Person {
        struct Body: Encodable { let email: String; let password: String }
        let res: API.AuthSessionResponse = try await http.post("/auth/signup", body: Body(email: email, password: password))
        tokenStore.token = res.token
        return res.user
    }

    func me() async throws -> API.Person {
        try await http.get("/me")
    }

    func logout() {
        tokenStore.token = nil
    }

    // MARK: Agents

    func agents() async throws -> [API.Agent] { try await http.get("/agents") }
    func agent(_ id: String) async throws -> API.Agent { try await http.get("/agents/\(id)") }

    // MARK: Sessions

    func sessions() async throws -> [API.Session] { try await http.get("/sessions") }
    func createSession(_ input: API.CreateSessionInput) async throws -> API.Session {
        try await http.post("/sessions", body: input)
    }
    func session(_ id: String) async throws -> API.Session { try await http.get("/sessions/\(id)") }
    func updateSession(_ id: String, title: String) async throws -> API.Session {
        struct Patch: Encodable { let title: String }
        return try await http.patch("/sessions/\(id)", body: Patch(title: title))
    }
    func archiveSession(_ id: String) async throws { try await http.delete("/sessions/\(id)") }

    // MARK: Messages

    func messages(_ sessionId: String) async throws -> [API.Message] {
        try await http.get("/sessions/\(sessionId)/messages")
    }
    func sendMessage(_ sessionId: String, body: String) async throws -> API.Message {
        struct Body: Encodable { let body: String }
        return try await http.post("/sessions/\(sessionId)/messages", body: Body(body: body))
    }

    // MARK: Approvals

    func approvals(status: String = "pending") async throws -> [API.Approval] {
        try await http.get("/approvals?status=\(status)")
    }
    func decideApproval(_ id: String, action: String) async throws -> API.Approval {
        struct Body: Encodable { let action: String }
        return try await http.post("/approvals/\(id)/decide", body: Body(action: action))
    }

    // MARK: Artifacts

    func sessionArtifacts(_ sessionId: String) async throws -> [API.Artifact] {
        try await http.get("/sessions/\(sessionId)/artifacts")
    }
    func artifact(_ id: String) async throws -> API.Artifact { try await http.get("/artifacts/\(id)") }
    func createArtifact(
        _ sessionId: String,
        kind: API.ArtifactKind,
        name: String,
        content: API.ArtifactContent? = nil
    ) async throws -> API.Artifact {
        try await http.post(
            "/sessions/\(sessionId)/artifacts",
            body: API.CreateArtifactInput(kind: kind, name: name, content: content)
        )
    }
    func updateArtifact(_ id: String, name: String? = nil, content: API.ArtifactContent? = nil) async throws -> API.Artifact {
        try await http.patch("/artifacts/\(id)", body: API.UpdateArtifactInput(name: name, content: content))
    }
    func shareArtifact(_ id: String, personIds: [String], role: API.PersonRole?) async throws -> API.Artifact {
        try await http.post("/artifacts/\(id)/share", body: API.ShareArtifactInput(personIds: personIds, role: role))
    }
    func deleteArtifact(_ id: String) async throws { try await http.delete("/artifacts/\(id)") }

    // MARK: Jobs

    func jobs() async throws -> [API.Job] { try await http.get("/jobs") }
    func createJob(_ input: API.CreateJobInput) async throws -> API.Job {
        try await http.post("/jobs", body: input)
    }
    func job(_ id: String) async throws -> API.Job { try await http.get("/jobs/\(id)") }
    func pauseJob(_ id: String) async throws -> API.Job { try await http.post("/jobs/\(id)/pause") }
    func cancelJob(_ id: String) async throws -> API.Job { try await http.post("/jobs/\(id)/cancel") }
    func jobLogs(_ id: String) async throws -> [API.LogEntry] { try await http.get("/jobs/\(id)/logs") }

    // MARK: Settings

    func getSettings() async throws -> API.Settings { try await http.get("/settings") }
    func updateSettings(_ input: API.UpdateSettingsInput) async throws -> API.Settings {
        try await http.patch("/settings", body: input)
    }
    func testSettings(_ input: API.UpdateSettingsInput) async throws -> API.TestResult {
        try await http.post("/settings/test", body: input)
    }
}
