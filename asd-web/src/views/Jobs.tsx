import { useState } from "react";
import { useApp } from "../store";
import { jobMeta } from "../format";
import { StatusBar } from "../components";

const pillFor = (s: string) =>
  s === "running" ? "run" : s === "scheduled" ? "sched" : s === "failed" ? "fail" : s === "paused" ? "sched" : "ok";
const labelFor = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const GROUPS = [
  { key: "running", label: "Running" },
  { key: "scheduled", label: "Scheduled" },
  { key: "paused", label: "Paused" },
  { key: "done", label: "Done" },
  { key: "failed", label: "Failed" },
] as const;

export default function Jobs({ onOpen }: { onOpen: (id: string) => void }) {
  const { jobs, agents, createJob } = useApp();
  const [showNew, setShowNew] = useState(false);

  return (
    <>
      <StatusBar />
      <div className="listhead">
        <div className="listtitle">Jobs</div>
        <button className="linkbtn" onClick={() => setShowNew(true)}>
          New
        </button>
      </div>
      <div className="body">
        {GROUPS.map((g) => {
          const rows = jobs.filter((j) => j.status === g.key);
          if (!rows.length) return null;
          return (
            <div key={g.key}>
              <div className="section-label">{g.label}</div>
              {rows.map((j) => (
                <button
                  className="row"
                  key={j.id}
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => onOpen(j.id)}
                >
                  <span className="grow">
                    <span className="row-title">{j.title}</span>
                    <span className="row-meta">{jobMeta(j, agents)}</span>
                    {j.status === "running" ? (
                      <span className="progress">
                        <i style={{ width: `${Math.round(j.progress * 100)}%` }} />
                      </span>
                    ) : null}
                  </span>
                  <span className={`pill pill-${pillFor(j.status)}`}>{labelFor(j.status)}</span>
                </button>
              ))}
            </div>
          );
        })}
        {!jobs.length ? <div className="meta">No jobs yet.</div> : null}
      </div>

      {showNew ? (
        <NewJobModal agents={agents} createJob={createJob} onClose={() => setShowNew(false)} />
      ) : null}
    </>
  );
}

function NewJobModal({
  agents,
  createJob,
  onClose,
}: {
  agents: { id: string; name: string; description: string }[];
  createJob: (title: string, agentId: string) => Promise<unknown>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "researcher");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await createJob(title.trim() || "New job", agentId || "researcher");
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
          New job
        </div>

        <div className="section-label">Agent</div>
        {agents.map((a) => (
          <button
            key={a.id}
            className="row"
            style={{
              width: "100%",
              textAlign: "left",
              borderColor: agentId === a.id ? "var(--accent)" : "var(--border)",
            }}
            onClick={() => setAgentId(a.id)}
          >
            <span className="grow">
              <span className="row-title">{a.name}</span>
              <span className="row-meta">{a.description}</span>
            </span>
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "2px solid var(--border-2)",
                background: agentId === a.id ? "var(--accent)" : "transparent",
                flexShrink: 0,
              }}
            />
          </button>
        ))}

        <div className="section-label">Title</div>
        <input
          className="input"
          style={{ width: "100%" }}
          value={title}
          placeholder="e.g. Scrape reviews"
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void create()} disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
