import { createHttp } from "./http";
import { RealtimeClient } from "./ws";
import type {
  Agent,
  Approval,
  Artifact,
  ArtifactKind,
  Job,
  LogEntry,
  Message,
  Person,
  PersonRole,
  Session,
  Settings,
  UpdateSettingsInput,
} from "./types";

export type ApiConfig = {
  baseUrl: string; // http://localhost:4000/api/v1
  wsUrl: string; // ws://localhost:4000/ws
  getToken: () => string | null;
  setToken: (token: string | null) => void;
};

export type CreateSessionInput = { title: string; leadAgentId: string; memberIds?: string[] };
export type DecideApprovalInput = { action: "approve" | "reject" | "edit"; edits?: unknown };
export type CreateArtifactInput = { kind: ArtifactKind; name: string; content?: Artifact["content"] };
export type UpdateArtifactInput = { name?: string; content?: Artifact["content"] };
export type ShareArtifactInput = { personIds: string[]; role?: PersonRole };
export type CreateJobInput = {
  title: string;
  agentId: string;
  scheduledFor?: string;
  recurring?: { rule: string };
};
export type AuthSessionResponse = { token: string; user: Person };

export class ApiClient {
  readonly realtime: RealtimeClient;
  private readonly request: ReturnType<typeof createHttp>;
  private readonly setToken: (token: string | null) => void;

  constructor(config: ApiConfig) {
    this.request = createHttp({ baseUrl: config.baseUrl, getToken: config.getToken });
    this.setToken = config.setToken;
    this.realtime = new RealtimeClient({ wsUrl: config.wsUrl, getToken: config.getToken });
  }

  // ---- auth ----
  async signup(email: string, password: string): Promise<Person> {
    const res = await this.request<AuthSessionResponse>("/auth/signup", { method: "POST", body: { email, password } });
    this.setToken(res.token);
    return res.user;
  }
  async login(email: string, password: string): Promise<Person> {
    const res = await this.request<AuthSessionResponse>("/auth/login", { method: "POST", body: { email, password } });
    this.setToken(res.token);
    return res.user;
  }
  me(): Promise<Person> {
    return this.request<Person>("/me");
  }

  // ---- agents ----
  agents(): Promise<Agent[]> {
    return this.request<Agent[]>("/agents");
  }
  agent(id: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${id}`);
  }

  // ---- sessions ----
  sessions(): Promise<Session[]> {
    return this.request<Session[]>("/sessions");
  }
  createSession(input: CreateSessionInput): Promise<Session> {
    return this.request<Session>("/sessions", { method: "POST", body: input });
  }
  session(id: string): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`);
  }
  updateSession(id: string, patch: { title?: string }): Promise<Session> {
    return this.request<Session>(`/sessions/${id}`, { method: "PATCH", body: patch });
  }
  archiveSession(id: string): Promise<void> {
    return this.request<void>(`/sessions/${id}`, { method: "DELETE" });
  }

  // ---- messages ----
  messages(sessionId: string, cursor?: string): Promise<Message[]> {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return this.request<Message[]>(`/sessions/${sessionId}/messages${q}`);
  }
  sendMessage(sessionId: string, body: string): Promise<Message> {
    return this.request<Message>(`/sessions/${sessionId}/messages`, { method: "POST", body: { body } });
  }

  // ---- approvals ----
  approvals(status?: "pending"): Promise<Approval[]> {
    const q = status ? `?status=${status}` : "";
    return this.request<Approval[]>(`/approvals${q}`);
  }
  decideApproval(id: string, input: DecideApprovalInput): Promise<Approval> {
    return this.request<Approval>(`/approvals/${id}/decide`, { method: "POST", body: input });
  }

  // ---- artifacts ----
  sessionArtifacts(sessionId: string): Promise<Artifact[]> {
    return this.request<Artifact[]>(`/sessions/${sessionId}/artifacts`);
  }
  artifact(id: string): Promise<Artifact> {
    return this.request<Artifact>(`/artifacts/${id}`);
  }
  createArtifact(sessionId: string, input: CreateArtifactInput): Promise<Artifact> {
    return this.request<Artifact>(`/sessions/${sessionId}/artifacts`, { method: "POST", body: input });
  }
  updateArtifact(id: string, patch: UpdateArtifactInput): Promise<Artifact> {
    return this.request<Artifact>(`/artifacts/${id}`, { method: "PATCH", body: patch });
  }
  deleteArtifact(id: string): Promise<void> {
    return this.request<void>(`/artifacts/${id}`, { method: "DELETE" });
  }
  shareArtifact(id: string, input: ShareArtifactInput): Promise<Artifact> {
    return this.request<Artifact>(`/artifacts/${id}/share`, { method: "POST", body: input });
  }

  // ---- share links ----
  createShareLink(id: string, input: { password?: string; expiresAt?: string }): Promise<{ id: string; token: string; url: string }> {
    return this.request<{ id: string; token: string; url: string }>(`/artifacts/${id}/share-links`, { method: "POST", body: input });
  }
  deleteShareLink(artifactId: string, linkId: string): Promise<void> {
    return this.request<void>(`/artifacts/${artifactId}/share-links/${linkId}`, { method: "DELETE" });
  }
  getShare(token: string, key?: string): Promise<{ needsPassword: boolean; artifact?: Artifact }> {
    const q = key ? `?key=${encodeURIComponent(key)}` : "";
    return this.request<{ needsPassword: boolean; artifact?: Artifact }>(`/share/${token}${q}`);
  }
  unlockShare(token: string, password: string): Promise<{ key: string }> {
    return this.request<{ key: string }>(`/share/${token}/unlock`, { method: "POST", body: { password } });
  }

  // ---- jobs ----
  jobs(): Promise<Job[]> {
    return this.request<Job[]>("/jobs");
  }
  createJob(input: CreateJobInput): Promise<Job> {
    return this.request<Job>("/jobs", { method: "POST", body: input });
  }
  job(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}`);
  }
  pauseJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/pause`, { method: "POST" });
  }
  cancelJob(id: string): Promise<Job> {
    return this.request<Job>(`/jobs/${id}/cancel`, { method: "POST" });
  }
  jobLogs(id: string, cursor?: string): Promise<LogEntry[]> {
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    return this.request<LogEntry[]>(`/jobs/${id}/logs${q}`);
  }

  // ---- settings ----
  getSettings(): Promise<Settings> {
    return this.request<Settings>("/settings");
  }
  updateSettings(input: UpdateSettingsInput): Promise<Settings> {
    return this.request<Settings>("/settings", { method: "PATCH", body: input });
  }
  testSettings(input: UpdateSettingsInput): Promise<{ ok: boolean; message: string }> {
    return this.request<{ ok: boolean; message: string }>("/settings/test", { method: "POST", body: input });
  }
}
