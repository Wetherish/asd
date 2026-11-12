import { useApp } from "../store";
import { StatusBar, TopBar, DefaultActions } from "../components";
import { Chevron } from "../icons";

export default function AgentDetail({
  id,
  onBack,
  onStart,
}: {
  id: string;
  onBack: () => void;
  onStart: () => void;
}) {
  const { agents } = useApp();
  const a = agents.find((x) => x.id === id);
  if (!a) return null;

  return (
    <>
      <StatusBar />
      <TopBar over="Agent" title={a.name} onBack={onBack} actions={<DefaultActions onMenu={() => {}} />} />
      <div className="body">
        <div className="serif" style={{ fontSize: 34, lineHeight: 1 }}>
          {a.name}
        </div>
        <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 6 }}>{a.description}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: a.status === "active" ? "var(--success)" : "var(--text-3)",
            }}
          />
          <span className="overline" style={{ fontSize: 10, color: a.status === "active" ? "var(--success)" : "var(--text-3)" }}>
            {a.status === "active" ? "Active" : "Paused"}
          </span>
        </div>

        <div className="section-label">Capabilities</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {a.capabilities.map((c) => (
            <span key={c} className="pill pill-sched">
              {c}
            </span>
          ))}
        </div>

        <div className="section-label">Connected</div>
        {a.connections.length ? (
          a.connections.map((c) => (
            <div className="row" key={c.id} style={{ marginTop: 8 }}>
              <span className="grow">
                <span className="row-title">{c.service}</span>
                <span className="row-meta">{c.scope}</span>
              </span>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: c.status === "connected" ? "var(--success)" : "var(--text-3)",
                }}
              />
            </div>
          ))
        ) : (
          <div className="meta" style={{ marginTop: 8 }}>
            No connections — they&apos;re requested only when a task needs one.
          </div>
        )}

        <div className="section-label">Delegation</div>
        <div className="row">
          <span className="grow">
            <span className="row-title">Called by</span>
            <span className="row-meta">Lead agents in shared sessions</span>
          </span>
          <Chevron width={15} height={15} />
        </div>
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onStart}>
          Start a session
        </button>
        <button className="btn btn-ghost">Edit</button>
      </div>
    </>
  );
}
