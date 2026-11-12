import type { Agent, Job, Session } from "./api/types";

export function agentName(agents: Agent[], id: string): string {
  return agents.find((a) => a.id === id)?.name ?? id;
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.round(d / 7)}w`;
}

export function groupFor(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.floor((day(now) - day(d)) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return "This week";
}

export function sessionMeta(session: Session): string {
  const n = session.members.length;
  return n > 1 ? `Shared · ${n} people` : "Personal";
}

export function jobMeta(job: Job, agents: Agent[]): string {
  const agent = agentName(agents, job.agentId);
  if (job.status === "running") {
    const total = job.steps.length;
    if (total > 0) {
      const done = job.steps.filter((s) => s.status === "done" || s.status === "running").length;
      return `${agent} · step ${Math.min(done + 1, total)} of ${total}`;
    }
  }
  if (job.status === "scheduled" && job.recurring) return `${agent} · ${job.recurring.rule}`;
  if (job.status === "failed") return `${agent} · ${job.logs.length} errors`;
  return agent;
}
