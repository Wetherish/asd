import Combine
import Foundation

/// App-wide observable state: bootstraps auth, loads the top-level lists, and
/// keeps them live via the realtime client + a polling fallback (mirrors
/// `asd-web/src/store.tsx`).
@MainActor
final class AppStore: ObservableObject {
    @Published var ready = false
    @Published var needsAuth = false
    @Published var errorMessage: String?
    @Published var me: API.Person?
    @Published var agents: [API.Agent] = []
    @Published var sessions: [API.Session] = []
    @Published var jobs: [API.Job] = []
    @Published var approvals: [API.Approval] = []

    let client: APIClient
    private var didBootstrap = false

    init(client: APIClient) {
        self.client = client
    }

    static func live() -> AppStore {
        // The asd-server host (REST /api/v1, WS /ws).
        //   Local dev: "localhost:4000"
        //   AWS EC2:   "<ec2-public-ip>:4000"  (printed by `terraform apply` as app_url)
        let host = "localhost:4000"
        let base = URL(string: "http://\(host)/api/v1")!
        let ws = URL(string: "ws://\(host)/ws")!
        return AppStore(client: APIClient(baseURL: base, wsURL: ws))
    }

    func bootstrap() async {
        guard !didBootstrap else { return }
        didBootstrap = true
        guard client.hasToken else {
            needsAuth = true
            return
        }
        do {
            me = try await client.me()
            await loadAll()
        } catch {
            client.logout()
            needsAuth = true
        }
    }

    func login(email: String, password: String) async throws {
        me = try await client.login(email: email, password: password)
        needsAuth = false
        await loadAll()
    }

    func signup(email: String, password: String) async throws {
        me = try await client.signup(email: email, password: password)
        needsAuth = false
        await loadAll()
    }

    func logout() {
        client.logout()
        me = nil
        needsAuth = true
    }

    private func loadAll() async {
        agents = (try? await client.agents()) ?? []
        sessions = (try? await client.sessions()) ?? []
        jobs = (try? await client.jobs()) ?? []
        approvals = (try? await client.approvals(status: "pending")) ?? []
        client.realtime.connect()
        ready = true
        startRealtime()
        startPolling()
    }

    func agentName(_ id: String) -> String {
        agents.first { $0.id == id }?.name ?? id
    }

    func decideApproval(_ id: String, action: String) async {
        _ = try? await client.decideApproval(id, action: action)
        await reloadApprovals()
    }

    @discardableResult
    func createSession(title: String, leadAgentId: String) async -> API.Session? {
        let session = try? await client.createSession(API.CreateSessionInput(title: title, leadAgentId: leadAgentId))
        await reloadSessions()
        return session
    }

    func createJob(title: String, agentId: String) async {
        _ = try? await client.createJob(API.CreateJobInput(title: title, agentId: agentId, scheduledFor: nil, recurring: nil))
        await reloadJobs()
    }

    func pauseJob(_ id: String) async {
        _ = try? await client.pauseJob(id)
        await reloadJobs()
    }

    func cancelJob(_ id: String) async {
        _ = try? await client.cancelJob(id)
        await reloadJobs()
    }

    func renameSession(_ id: String, title: String) async {
        _ = try? await client.updateSession(id, title: title)
        await reloadSessions()
    }

    func archiveSession(_ id: String) async {
        try? await client.archiveSession(id)
        await reloadSessions()
    }

    // MARK: Private

    private func reloadSessions() async {
        if let value = try? await client.sessions() { sessions = value }
    }

    private func reloadJobs() async {
        if let value = try? await client.jobs() { jobs = value }
    }

    private func reloadApprovals() async {
        if let value = try? await client.approvals(status: "pending") { approvals = value }
    }

    private func startRealtime() {
        Task { [weak self] in
            guard let self else { return }
            for await event in self.client.realtime.events(.global, id: "global") {
                switch event {
                case .approvalCreated, .approvalUpdated:
                    await self.reloadApprovals()
                case .jobUpdated:
                    await self.reloadJobs()
                case .sessionUpdated:
                    await self.reloadSessions()
                default:
                    break
                }
            }
        }
    }

    private func startPolling() {
        Task { [weak self] in
            while let self = self {
                try? await Task.sleep(nanoseconds: 4_000_000_000)
                if Task.isCancelled { break }
                await self.reloadJobs()
                await self.reloadApprovals()
            }
        }
    }
}
