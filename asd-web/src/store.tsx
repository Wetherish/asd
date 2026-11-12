import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, tokenStore } from "./api";
import type { Agent, Approval, Job, Person, Session } from "./api/types";

export type AppState = {
  ready: boolean;
  needsAuth: boolean;
  me: Person | null;
  agents: Agent[];
  sessions: Session[];
  jobs: Job[];
  approvals: Approval[];
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  decideApproval: (id: string, action: "approve" | "reject" | "edit") => Promise<void>;
  createSession: (title: string, leadAgentId: string) => Promise<Session>;
  renameSession: (id: string, title: string) => Promise<void>;
  archiveSession: (id: string) => Promise<void>;
  createJob: (title: string, agentId: string) => Promise<Job>;
  pauseJob: (id: string) => Promise<void>;
  cancelJob: (id: string) => Promise<void>;
};

const Ctx = createContext<AppState | null>(null);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [me, setMe] = useState<Person | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);

  const reloadSessions = useCallback(async () => setSessions(await api.sessions()), []);
  const reloadJobs = useCallback(async () => setJobs(await api.jobs()), []);
  const reloadApprovals = useCallback(async () => setApprovals(await api.approvals("pending")), []);

  const bootstrap = useCallback(async () => {
    const [ag, se, jo, ap] = await Promise.all([
      api.agents(),
      api.sessions(),
      api.jobs(),
      api.approvals("pending"),
    ]);
    setAgents(ag);
    setSessions(se);
    setJobs(jo);
    setApprovals(ap);
    api.realtime.connect();
    setReady(true);
  }, []);

  // Restore an existing session on load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.get()) {
        setNeedsAuth(true);
        return;
      }
      try {
        const user = await api.me();
        if (cancelled) return;
        setMe(user);
        await bootstrap();
      } catch {
        if (!cancelled) {
          tokenStore.set(null);
          setNeedsAuth(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  const login = useCallback(
    async (email: string, password: string) => {
      const user = await api.login(email, password);
      setMe(user);
      await bootstrap();
      setNeedsAuth(false);
    },
    [bootstrap],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const user = await api.signup(email, password);
      setMe(user);
      await bootstrap();
      setNeedsAuth(false);
    },
    [bootstrap],
  );

  const logout = useCallback(() => {
    tokenStore.set(null);
    window.location.reload();
  }, []);

  // Realtime: keep global lists fresh.
  useEffect(() => {
    if (!ready) return;
    return api.realtime.subscribe("global", "global", (e) => {
      if (e.type === "approval.created" || e.type === "approval.updated") void reloadApprovals();
      else if (e.type === "job.updated") void reloadJobs();
      else if (e.type === "session.updated") void reloadSessions();
    });
  }, [ready, reloadApprovals, reloadJobs, reloadSessions]);

  // Polling fallback (contract §6) — reconcile jobs + approvals even if WS drops.
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      void reloadJobs();
      void reloadApprovals();
    }, 4000);
    return () => clearInterval(timer);
  }, [ready, reloadJobs, reloadApprovals]);

  const decideApproval = useCallback(
    async (id: string, action: "approve" | "reject" | "edit") => {
      await api.decideApproval(id, { action });
      await reloadApprovals();
    },
    [reloadApprovals],
  );

  const createSession = useCallback(
    async (title: string, leadAgentId: string) => {
      const session = await api.createSession({ title, leadAgentId });
      await reloadSessions();
      return session;
    },
    [reloadSessions],
  );

  const renameSession = useCallback(
    async (id: string, title: string) => {
      await api.updateSession(id, { title });
      await reloadSessions();
    },
    [reloadSessions],
  );

  const archiveSession = useCallback(
    async (id: string) => {
      await api.archiveSession(id);
      await reloadSessions();
    },
    [reloadSessions],
  );

  const createJob = useCallback(
    async (title: string, agentId: string) => {
      const job = await api.createJob({ title, agentId });
      await reloadJobs();
      return job;
    },
    [reloadJobs],
  );

  const pauseJob = useCallback(
    async (id: string) => {
      await api.pauseJob(id);
      await reloadJobs();
    },
    [reloadJobs],
  );

  const cancelJob = useCallback(
    async (id: string) => {
      await api.cancelJob(id);
      await reloadJobs();
    },
    [reloadJobs],
  );

  return (
    <Ctx.Provider
      value={{
        ready,
        needsAuth,
        me,
        agents,
        sessions,
        jobs,
        approvals,
        login,
        signup,
        logout,
        decideApproval,
        createSession,
        renameSession,
        archiveSession,
        createJob,
        pauseJob,
        cancelJob,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within ApiProvider");
  return ctx;
}
