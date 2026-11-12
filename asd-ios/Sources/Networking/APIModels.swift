import Foundation

/// Arbitrary JSON placeholder for `unknown` fields (canvas/dashboard `data`,
/// error `details`). Decodes/encodes any JSON value.
enum JSONValue: Codable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil() { self = .null; return }
        if let b = try? c.decode(Bool.self) { self = .bool(b); return }
        if let n = try? c.decode(Double.self) { self = .number(n); return }
        if let s = try? c.decode(String.self) { self = .string(s); return }
        if let a = try? c.decode([JSONValue].self) { self = .array(a); return }
        if let o = try? c.decode([String: JSONValue].self) { self = .object(o); return }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "Unsupported JSON value")
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .number(let n): try c.encode(n)
        case .bool(let b): try c.encode(b)
        case .array(let a): try c.encode(a)
        case .object(let o): try c.encode(o)
        case .null: try c.encodeNil()
        }
    }
}

/// Namespace for the API contract models (design/03-api.md). The single source
/// of truth for the Swift client and UI.
enum API {
    // MARK: Identity

    enum PersonRole: String, Codable { case owner, editor, viewer }

    struct Person: Codable, Identifiable, Hashable {
        let id: String
        let name: String
        let email: String
        let color: String
        let role: PersonRole
    }

    enum ConnectionStatus: String, Codable { case connected, available }

    struct Connection: Codable, Identifiable, Hashable {
        let id: String
        let service: String
        let scope: String
        let status: ConnectionStatus
        let grantedAt: String?
    }

    enum AgentStatus: String, Codable { case active, paused }

    struct Agent: Codable, Identifiable, Hashable {
        let id: String
        let name: String
        let description: String
        let capabilities: [String]
        let status: AgentStatus
        let connections: [Connection]
    }

    struct Session: Codable, Identifiable, Hashable {
        let id: String
        let title: String
        let leadAgentId: String
        let members: [Person]
        let createdAt: String
        let updatedAt: String
        let archived: Bool
    }

    // MARK: Chat

    enum MessageRole: String, Codable { case user, agent }
    enum MessageStatus: String, Codable { case streaming, complete, error }
    enum ArtifactKind: String, Codable { case table, doc, canvas, dashboard }

    struct ArtifactRef: Codable, Hashable {
        let id: String
        let kind: ArtifactKind
        let name: String
    }

    enum TraceStatus: String, Codable { case queued, working, done, failed }

    struct TraceEntry: Codable, Identifiable, Hashable {
        let id: String
        let agentId: String
        let title: String
        let status: TraceStatus
        let progress: Double?
        let detail: String?
    }

    enum ApprovalStatus: String, Codable { case pending, approved, rejected, edited }
    enum ApprovalKind: String, Codable { case action, content }

    struct Approval: Codable, Identifiable, Hashable {
        let id: String
        let sessionId: String
        let messageId: String
        let title: String
        let meta: String
        let kind: ApprovalKind
        let status: ApprovalStatus
        let actions: [String]
        let createdAt: String
        let decidedBy: String?
        let decidedAt: String?
    }

    struct Message: Codable, Identifiable, Hashable {
        let id: String
        let sessionId: String
        let role: MessageRole
        let authorId: String
        let body: String
        let createdAt: String
        let status: MessageStatus
        let trace: [TraceEntry]?
        let artifacts: [ArtifactRef]?
        let approval: Approval?
    }

    // MARK: Artifacts

    enum CanvasNodeType: String, Codable { case note, shape, text }

    struct CanvasNode: Codable, Hashable {
        let id: String
        let type: CanvasNodeType
        let x: Double
        let y: Double
        let data: JSONValue?
    }

    struct Widget: Codable, Hashable {
        let id: String
        let type: String
        let data: JSONValue?
    }

    /// Flattened mirror of the contract's `content` union — `kind` selects the
    /// populated fields; the others are `nil` (and omitted when encoded).
    struct ArtifactContent: Codable, Hashable {
        let kind: ArtifactKind
        let columns: [String]?
        let rows: [[String]]?
        let body: String?
        let nodes: [CanvasNode]?
        let widgets: [Widget]?

        static func empty(_ kind: ArtifactKind) -> ArtifactContent {
            switch kind {
            case .table: return .init(kind: .table, columns: [], rows: [], body: nil, nodes: nil, widgets: nil)
            case .doc: return .init(kind: .doc, columns: nil, rows: nil, body: "", nodes: nil, widgets: nil)
            case .canvas: return .init(kind: .canvas, columns: nil, rows: nil, body: nil, nodes: [], widgets: nil)
            case .dashboard: return .init(kind: .dashboard, columns: nil, rows: nil, body: nil, nodes: nil, widgets: [])
            }
        }
    }

    struct Artifact: Codable, Identifiable, Hashable {
        let id: String
        let sessionId: String
        let kind: ArtifactKind
        let name: String
        let authorId: String
        let createdAt: String
        let updatedAt: String
        let content: ArtifactContent
        let sharedWith: [Person]
    }

    // MARK: Jobs

    enum JobStatus: String, Codable { case running, scheduled, done, failed, paused }
    enum JobStepStatus: String, Codable { case queued, running, done, failed }

    struct JobStep: Codable, Identifiable, Hashable {
        let id: String
        let title: String
        let status: JobStepStatus
        let detail: String?
    }

    enum LogLevel: String, Codable { case info, warn, error }

    struct LogEntry: Codable, Hashable {
        let ts: String
        let level: LogLevel
        let text: String
    }

    struct Recurrence: Codable, Hashable {
        let rule: String
    }

    struct Job: Codable, Identifiable, Hashable {
        let id: String
        let title: String
        let agentId: String
        let status: JobStatus
        let progress: Double
        let createdAt: String
        let scheduledFor: String?
        let recurring: Recurrence?
        let steps: [JobStep]
        let logs: [LogEntry]
    }

    // MARK: Envelopes / inputs

    struct ErrorBody: Codable {
        let code: String
        let message: String
        let details: JSONValue?
    }

    struct AuthSessionResponse: Codable {
        let token: String
        let user: Person
    }

    struct CreateSessionInput: Encodable {
        let title: String
        let leadAgentId: String
        let memberIds: [String]?

        init(title: String, leadAgentId: String, memberIds: [String]? = nil) {
            self.title = title
            self.leadAgentId = leadAgentId
            self.memberIds = memberIds
        }
    }

    struct CreateArtifactInput: Encodable {
        let kind: ArtifactKind
        let name: String
        let content: ArtifactContent?
    }

    struct UpdateArtifactInput: Encodable {
        let name: String?
        let content: ArtifactContent?

        init(name: String? = nil, content: ArtifactContent? = nil) {
            self.name = name
            self.content = content
        }
    }

    struct ShareArtifactInput: Encodable {
        let personIds: [String]
        let role: PersonRole?
    }

    struct CreateJobInput: Encodable {
        let title: String
        let agentId: String
        let scheduledFor: String?
        let recurring: Recurrence?
    }

    // MARK: Settings

    struct Settings: Codable {
        let provider: String
        let model: String
        let baseUrl: String
        let apiKeySet: Bool
    }

    struct UpdateSettingsInput: Encodable {
        let provider: String?
        let model: String?
        let apiKey: String?
        let baseUrl: String?

        init(provider: String? = nil, model: String? = nil, apiKey: String? = nil, baseUrl: String? = nil) {
            self.provider = provider
            self.model = model
            self.apiKey = apiKey
            self.baseUrl = baseUrl
        }
    }

    struct TestResult: Codable {
        let ok: Bool
        let message: String
    }
}
