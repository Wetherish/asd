import { useState } from "react";
import { useApp } from "../store";
import { agentName, jobMeta, relativeTime } from "../format";
import { Gear, Mic, Moon, Sun } from "../icons";
import { StatusBar } from "../components";
import { api } from "../api";
import TalkOverlay from "./TalkOverlay";

type Props = {
  onOpenSession: (id: string) => void;
  onSettings: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export default function Home({ onOpenSession, onSettings, theme, onToggleTheme }: Props) {
  const { me, sessions, jobs, approvals, agents, decideApproval, createSession } = useApp();
  const [talkOpen, setTalkOpen] = useState(false);
  const recent = sessions.slice(0, 2);
  const running = jobs.filter((j) => j.status === "running").slice(0, 3);
  const needsYou = approvals[0];

  const handleTalkDone = async (transcript: string, leadAgentId?: string) => {
    const title = transcript.split(/\s+/).slice(0, 6).join(" ") || "New session";
    const session = await createSession(title, leadAgentId || agents[0]?.id || "researcher");
    await api.sendMessage(session.id, transcript);
    onOpenSession(session.id);
  };

  return (
    <>
      <StatusBar />
      <div className="body" style={{ paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="overline">Good morning</div>
            <div className="hero">{me?.name ?? "Alex"}</div>
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

        <button className="talk" onClick={() => setTalkOpen(true)}>
          <Mic />Talk
        </button>

        <div className="section-label">Needs you</div>
        {needsYou ? (
          <div className="approval" style={{ marginTop: 0 }}>
            <div className="app-title">{needsYou.title}</div>
            <div className="meta" style={{ marginTop: 3 }}>
              {needsYou.meta}
            </div>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => void decideApproval(needsYou.id, "approve")}>
                Approve
              </button>
              <button className="btn btn-ghost" onClick={() => void decideApproval(needsYou.id, "edit")}>
                Review
              </button>
              <button className="btn btn-danger" onClick={() => void decideApproval(needsYou.id, "reject")}>
                Reject
              </button>
            </div>
          </div>
        ) : (
          <div className="meta" style={{ marginTop: 0 }}>
            All caught up — nothing needs you right now.
          </div>
        )}

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
                {agentName(agents, s.leadAgentId)} · {s.members.length > 1 ? `Shared · ${s.members.length} people` : "Personal"}
              </span>
            </span>
            <span className="meta">{relativeTime(s.updatedAt)}</span>
          </button>
        ))}

        <div className="section-label">Jobs</div>
        {running.length ? (
          running.map((j) => (
            <div className="row" key={j.id}>
              <span className="grow">
                <span className="row-title">{j.title}</span>
                <span className="row-meta">{jobMeta(j, agents)}</span>
                <span className="progress">
                  <i style={{ width: `${Math.round(j.progress * 100)}%` }} />
                </span>
              </span>
              <span className="pill pill-run">running</span>
            </div>
          ))
        ) : (
          <div className="meta">No running jobs.</div>
        )}
      </div>

      {talkOpen ? (
        <TalkOverlay
          mode="home"
          agents={agents}
          onClose={() => setTalkOpen(false)}
          onDone={handleTalkDone}
        />
      ) : null}
    </>
  );
}
