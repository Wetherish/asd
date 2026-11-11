import { agents } from "../data";
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
  const a = agents.find((x) => x.id === id)!;

  return (
    <>
      <StatusBar />
      <TopBar over="Agent" title={a.name} onBack={onBack} actions={<DefaultActions onMenu={() => {}} />} />
      <div className="body">
        <div className="serif" style={{ fontSize: 34, lineHeight: 1 }}>
          {a.name}
        </div>
        <div style={{ fontSize: 14.5, color: "var(--text-2)", lineHeight: 1.45, marginTop: 6 }}>{a.desc}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--success)" }} />
          <span className="overline" style={{ fontSize: 10, color: "var(--success)" }}>
            Active
          </span>
        </div>

        <div className="section-label">Capabilities</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {a.caps.map((c) => (
            <span key={c} className="pill pill-sched">
              {c}
            </span>
          ))}
        </div>

        <div className="section-label">Connected</div>
        {[
          ["GitHub", "read & write repositories"],
          ["AWS", "deploy · us-east-1"],
          ["Analytics DB", "read-only"],
        ].map(([name, scope]) => (
          <div className="row" key={name} style={{ marginTop: 8 }}>
            <span className="grow">
              <span className="row-title">{name}</span>
              <span className="row-meta">{scope}</span>
            </span>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
          </div>
        ))}

        <div className="section-label">Delegation</div>
        <div className="row">
          <span className="grow">
            <span className="row-title">Called by</span>
            <span className="row-meta">Researcher · Planner</span>
          </span>
          <Chevron width={15} height={15} />
        </div>

        <div className="section-label">Recent sessions</div>
        {[
          ["Build dashboard", "Vacuum research · 2m"],
          ["Deploy staging", "Project design · 1h"],
        ].map(([title, meta]) => (
          <div className="row" key={title}>
            <span className="grow">
              <span className="row-title">{title}</span>
              <span className="row-meta">{meta}</span>
            </span>
            <Chevron width={15} height={15} />
          </div>
        ))}
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
