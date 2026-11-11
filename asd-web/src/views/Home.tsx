import { approval, jobs, sessions } from "../data";
import { Gear, Mic, Moon, Sun } from "../icons";
import { StatusBar } from "../components";

type Props = {
  onOpenSession: (id: string) => void;
  onSettings: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export default function Home({ onOpenSession, onSettings, theme, onToggleTheme }: Props) {
  const recent = sessions.slice(0, 2);
  const running = jobs.filter((j) => j.group === "running").slice(0, 2);

  return (
    <>
      <StatusBar />
      <div className="body" style={{ paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="overline">Good morning</div>
            <div className="hero">Alex</div>
          </div>
          <div style={{ display: "flex", gap: 2 }}>
            <button className="iconbtn" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === "light" ? <Moon /> : <Sun />}
            </button>
            <button className="iconbtn" onClick={onSettings} aria-label="Settings">
              <Gear />
            </button>
          </div>
        </div>

        <button className="talk">
          <Mic />Talk
        </button>

        <div className="section-label">Needs you</div>
        <div className="approval" style={{ marginTop: 0 }}>
          <div className="app-title">{approval.title}</div>
          <div className="meta" style={{ marginTop: 3 }}>
            {approval.meta}
          </div>
          <div className="actions">
            <button className="btn btn-primary">Approve</button>
            <button className="btn btn-ghost">Review</button>
          </div>
        </div>

        <div className="section-label">Recent</div>
        {recent.map((s) => (
          <button
            className="row"
            key={s.id}
            style={{ width: "100%", textAlign: "left" }}
            onClick={() => onOpenSession(s.id)}
          >
            <span className="grow">
              <span className="row-title">{s.title}</span>
              <span className="row-meta">
                {s.lead} · {s.meta}
              </span>
            </span>
            <span className="meta">{s.time}</span>
          </button>
        ))}

        <div className="section-label">Jobs</div>
        {running.map((j) => (
          <div className="row" key={j.id}>
            <span className="grow">
              <span className="row-title">{j.title}</span>
              <span className="row-meta">
                {j.agent} · {j.meta}
              </span>
            </span>
            <span className={`pill pill-${j.status === "running" ? "run" : "ok"}`}>{j.status}</span>
          </div>
        ))}
      </div>
    </>
  );
}
