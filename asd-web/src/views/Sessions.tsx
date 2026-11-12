import { useState } from "react";
import { useApp } from "../store";
import { agentName, groupFor, relativeTime, sessionMeta } from "../format";
import { StatusBar } from "../components";
import { Chevron, Search } from "../icons";

export default function Sessions({ onOpen }: { onOpen: (id: string) => void }) {
  const { sessions, agents, createSession } = useApp();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLead, setNewLead] = useState("");
  const [creating, setCreating] = useState(false);
  const groups = ["Today", "Yesterday", "This week"];

  const openNew = () => {
    setNewName("");
    setNewLead(agents[0]?.id ?? "researcher");
    setShowNew(true);
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const session = await createSession(newName.trim() || "New session", newLead || "researcher");
      setShowNew(false);
      onOpen(session.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <StatusBar />
      <div className="listhead">
        <div className="listtitle">Sessions</div>
        <button className="linkbtn" onClick={openNew}>
          New
        </button>
      </div>
      <div className="search">
        <Search />
        <span>Search</span>
      </div>
      <div className="body">
        {groups.map((g) => {
          const rows = sessions.filter((s) => groupFor(s.updatedAt) === g);
          if (!rows.length) return null;
          return (
            <div key={g}>
              <div className="section-label">{g}</div>
              {rows.map((s) => (
                <button
                  className="row"
                  key={s.id}
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => onOpen(s.id)}
                >
                  <span className="grow">
                    <span className="row-title">{s.title}</span>
                    <span className="row-meta">
                      {agentName(agents, s.leadAgentId)} · {sessionMeta(s)}
                    </span>
                  </span>
                  <span className="meta">{relativeTime(s.updatedAt)}</span>
                  <Chevron width={15} height={15} />
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {showNew ? (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
              New session
            </div>

            <div className="section-label">Lead agent</div>
            {agents.map((a) => (
              <button
                key={a.id}
                className="row"
                style={{
                  width: "100%",
                  textAlign: "left",
                  borderColor: newLead === a.id ? "var(--accent)" : "var(--border)",
                }}
                onClick={() => setNewLead(a.id)}
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
                    background: newLead === a.id ? "var(--accent)" : "transparent",
                    flexShrink: 0,
                  }}
                />
              </button>
            ))}

            <div className="section-label">Name</div>
            <input
              className="input"
              style={{ width: "100%" }}
              value={newName}
              placeholder="New session"
              onChange={(e) => setNewName(e.target.value)}
            />

            <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void create()} disabled={creating}>
                {creating ? "Creating…" : "Create"}
              </button>
              <button className="btn btn-ghost" onClick={() => setShowNew(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
