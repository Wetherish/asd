import { useState } from "react";
import { artifacts } from "../data";
import { StatusBar, TopBar, DefaultActions } from "../components";
import { Chevron, ChevronDown, Mic, Send, Share } from "../icons";

type Seg = "chat" | "artifacts" | "activity";

export default function SessionDetail({
  session,
  onBack,
}: {
  session: { id: string; title: string; lead: string };
  onBack: () => void;
}) {
  const [seg, setSeg] = useState<Seg>("chat");

  return (
    <>
      <StatusBar />
      <TopBar
        over={session.lead}
        title={session.title}
        onBack={onBack}
        actions={<DefaultActions onShare={() => {}} onMenu={() => {}} />}
      />

      <div className="seg" style={{ margin: "14px 20px 0" }}>
        {(["chat", "artifacts", "activity"] as Seg[]).map((s) => (
          <button key={s} className={seg === s ? "active" : ""} onClick={() => setSeg(s)}>
            {s}
          </button>
        ))}
      </div>

      {seg === "chat" ? (
        <>
          <div className="body">
            <div className="divider">Today</div>

            <div className="msg-over">Researcher</div>
            <div className="prose">Found three vacuums in budget. Builder is pulling live prices &amp; specs.</div>

            <div className="trace">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="grow">
                  <div className="trace-over">Builder · working</div>
                  <div className="trace-title">Gathering live prices &amp; specs</div>
                  <div className="meta" style={{ marginTop: 2 }}>
                    2 of 3
                  </div>
                </div>
                <ChevronDown width={15} height={15} />
              </div>
            </div>

            <div className="chip-link">
              <div className="grow">
                <div className="chip-over">Artifact</div>
                <div className="chip-title">Shortlist</div>
              </div>
              <Chevron width={15} height={15} />
            </div>

            <div className="bub-row right">
              <div className="bubble bub-you">Check the warranty too?</div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="msg-over">Researcher</div>
              <div className="prose">Done — two offer a 2-year warranty. I recommend the Shark.</div>
            </div>

            <div className="approval">
              <div className="app-title">Order the Shark RV1000?</div>
              <div className="meta" style={{ marginTop: 2 }}>
                £429 · delivers Thursday
              </div>
              <div className="actions">
                <button className="btn btn-primary">Approve</button>
                <button className="btn btn-ghost">Edit</button>
                <button className="btn btn-danger">Reject</button>
              </div>
            </div>
          </div>

          <div className="composer">
            <button className="cicon" aria-label="Voice">
              <Mic />
            </button>
            <div className="input">Message…</div>
            <button className="cicon send" aria-label="Send">
              <Send />
            </button>
          </div>
        </>
      ) : seg === "artifacts" ? (
        <div className="body">
          {artifacts.map((a) => (
            <div className="art-card" key={a.id} style={{ marginTop: 10 }}>
              <div className="grow">
                <div className="art-kind">{a.kind}</div>
                <div className="art-name">{a.name}</div>
                <div className="meta" style={{ marginTop: 3 }}>
                  {a.by} · updated {a.time}
                </div>
              </div>
              <Share width={17} height={17} />
            </div>
          ))}
          <div className="new-art">+ New artifact</div>
        </div>
      ) : (
        <div className="body">
          <div className="divider">Today</div>
          {[
            ["ok", "You approved — order the Shark", "just now"],
            ["run", "Builder gathering live prices", "2 of 3 · running"],
            ["ok", "Researcher drafted the shortlist", "3m"],
            ["accent", "Artifact created — Shortlist", "3m"],
            ["ok", "Session shared with 3 people", "1h"],
            ["ok", "Researcher created the session", "1h"],
          ].map(([kind, title, meta]) => (
            <div className="tl-item" key={title}>
              <span className={`tl-dot ${kind}`} />
              <div>
                <div className="tl-title">{title}</div>
                <div className="meta" style={{ marginTop: 2 }}>
                  {meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
