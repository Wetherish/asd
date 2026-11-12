import { useApp } from "../store";
import { StatusBar, TopBar } from "../components";
import { agentName, relativeTime } from "../format";
import type { Job } from "../api/types";
import { Pause, Trash } from "../icons";

const pillFor = (s: Job["status"]) =>
  s === "running" ? "run" : s === "scheduled" ? "sched" : s === "failed" ? "fail" : s === "paused" ? "sched" : "ok";

export default function JobDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { jobs, agents, pauseJob, cancelJob } = useApp();
  const job = jobs.find((j) => j.id === id);
  if (!job) return null;

  const active = job.status === "running" || job.status === "scheduled";
  const cancellable = job.status === "running" || job.status === "scheduled" || job.status === "paused";

  const stepDot = (s: Job["steps"][number]["status"]) =>
    s === "done" ? "ok" : s === "running" ? "run" : s === "failed" ? "run" : "accent";

  return (
    <>
      <StatusBar />
      <TopBar over={agentName(agents, job.agentId)} title={job.title} onBack={onBack} actions={<span style={{ width: 34 }} />} />

      <div className="body">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`pill pill-${pillFor(job.status)}`}>{job.status}</span>
          {job.recurring ? <span className="meta">{job.recurring.rule}</span> : null}
        </div>

        {job.status === "running" ? (
          <div className="progress" style={{ marginTop: 14 }}>
            <i style={{ width: `${Math.round(job.progress * 100)}%` }} />
          </div>
        ) : null}
        <div className="meta" style={{ marginTop: 6 }}>
          Started {relativeTime(job.createdAt)}
        </div>

        <div className="section-label">Steps</div>
        {job.steps.length ? (
          job.steps.map((s, i) => (
            <div className="step-row" key={s.id}>
              <span className={`tl-dot ${stepDot(s.status)}`} />
              <div className="grow">
                <div className="step-title">
                  {i + 1}. {s.title}
                </div>
                {s.detail ? (
                  <div className="meta" style={{ marginTop: 2 }}>
                    {s.detail}
                  </div>
                ) : null}
              </div>
              <span className="meta">{s.status}</span>
            </div>
          ))
        ) : (
          <div className="meta">No steps.</div>
        )}

        <div className="section-label">Logs</div>
        {job.logs.length ? (
          <div className="logs">
            {job.logs.map((l, i) => (
              <div key={i} className={`log-line log-${l.level}`}>
                <span className="log-ts">{new Date(l.ts).toLocaleTimeString()}</span>
                <span>{l.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="meta">No log entries.</div>
        )}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <button
          className="btn btn-ghost"
          style={{ flex: 1 }}
          onClick={() => void pauseJob(job.id)}
          disabled={!active}
        >
          <Pause width={15} height={15} />
          Pause
        </button>
        <button
          className="btn btn-danger"
          style={{ flex: 1 }}
          onClick={() => void cancelJob(job.id)}
          disabled={!cancellable}
        >
          <Trash width={15} height={15} />
          Cancel
        </button>
      </div>
    </>
  );
}
