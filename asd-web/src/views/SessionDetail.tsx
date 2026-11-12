import { useEffect, useState } from "react";
import { useApp } from "../store";
import { useMessages } from "../hooks";
import { api } from "../api";
import { agentName, relativeTime } from "../format";
import type { Agent, Approval, Artifact, ArtifactKind, Message, Session, TraceEntry } from "../api/types";
import { StatusBar, TopBar, DefaultActions } from "../components";
import { Chevron, ChevronDown, Mic, Send, Share } from "../icons";
import ArtifactView from "./ArtifactView";
import TalkOverlay from "./TalkOverlay";

type Seg = "chat" | "artifacts" | "activity";

const KINDS: { id: ArtifactKind; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "doc", label: "Doc" },
  { id: "canvas", label: "Canvas" },
  { id: "dashboard", label: "Dashboard" },
];

export default function SessionDetail({ session, onBack }: { session: Session; onBack: () => void }) {
  const { agents, decideApproval, renameSession, archiveSession } = useApp();
  const [seg, setSeg] = useState<Seg>("chat");
  const { messages, loading, sending, streams, send } = useMessages(session.id);
  const [draft, setDraft] = useState("");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const [viewArtifact, setViewArtifact] = useState<Artifact | null>(null);
  const [showNewArtifact, setShowNewArtifact] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);

  const loadArtifacts = async () => {
    try {
      setArtifacts(await api.sessionArtifacts(session.id));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    void loadArtifacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id]);

  const openArtifact = async (id: string) => {
    let full = artifacts.find((a) => a.id === id);
    if (!full) {
      try {
        full = await api.artifact(id);
      } catch {
        return;
      }
    }
    setViewArtifact(full);
  };

  const archive = async () => {
    if (!window.confirm(`Archive “${session.title}”?`)) return;
    await archiveSession(session.id);
    onBack();
  };

  const submit = () => {
    if (!draft.trim()) return;
    void send(draft);
    setDraft("");
  };

  return (
    <>
      <StatusBar />
      <TopBar
        over={agentName(agents, session.leadAgentId)}
        title={session.title}
        onBack={onBack}
        actions={<DefaultActions onMenu={() => setShowMenu(true)} />}
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
            {loading ? (
              <div className="meta" style={{ marginTop: 12 }}>
                Loading…
              </div>
            ) : (
              messages.map((m) => (
                <MessageBlock
                  key={m.id}
                  m={m}
                  agents={agents}
                  stream={streams[m.id] ?? ""}
                  decideApproval={decideApproval}
                  onOpenArtifact={openArtifact}
                />
              ))
            )}
          </div>
          <div className="composer">
            <button className="cicon" aria-label="Voice" onClick={() => setTalkOpen(true)}>
              <Mic />
            </button>
            <input
              className="input"
              value={draft}
              placeholder="Message…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <button className="cicon send" aria-label="Send" disabled={sending || !draft.trim()} onClick={submit}>
              <Send />
            </button>
          </div>
        </>
      ) : seg === "artifacts" ? (
        <div className="body">
          {artifacts.length ? (
            artifacts.map((a) => (
              <button
                className="art-card"
                key={a.id}
                style={{ width: "100%", textAlign: "left", marginTop: 10 }}
                onClick={() => setViewArtifact(a)}
              >
                <span className="grow">
                  <span className="art-kind">{a.kind}</span>
                  <span className="art-name">{a.name}</span>
                  <span className="meta" style={{ marginTop: 3 }}>
                    {agentName(agents, a.authorId)} · updated {relativeTime(a.updatedAt)}
                  </span>
                </span>
                <Share width={17} height={17} />
              </button>
            ))
          ) : (
            <div className="meta" style={{ marginTop: 12 }}>
              No artifacts yet.
            </div>
          )}
          <button className="new-art" style={{ width: "100%" }} onClick={() => setShowNewArtifact(true)}>
            + New artifact
          </button>
        </div>
      ) : (
        <div className="body">
          <div className="divider">Today</div>
          {activity(messages, agents).map((it) => (
            <div className="tl-item" key={it.title}>
              <span className={`tl-dot ${it.kind}`} />
              <div>
                <div className="tl-title">{it.title}</div>
                <div className="meta" style={{ marginTop: 2 }}>
                  {it.meta}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewArtifact ? (
        <ArtifactView
          artifact={viewArtifact}
          members={session.members}
          onClose={() => setViewArtifact(null)}
          onChanged={() => void loadArtifacts()}
        />
      ) : null}

      {showNewArtifact ? (
        <NewArtifactModal sessionId={session.id} onClose={() => setShowNewArtifact(false)} onCreated={() => void loadArtifacts()} />
      ) : null}

      {showMenu ? (
        <SessionMenu
          session={session}
          onRename={() => {
            setShowMenu(false);
            setShowRename(true);
          }}
          onArchive={() => {
            setShowMenu(false);
            void archive();
          }}
          onClose={() => setShowMenu(false)}
        />
      ) : null}

      {showRename ? (
        <RenameModal
          title={session.title}
          onClose={() => setShowRename(false)}
          onSave={async (title) => {
            await renameSession(session.id, title);
            setShowRename(false);
          }}
        />
      ) : null}

      {talkOpen ? (
        <TalkOverlay
          mode="composer"
          title={session.title}
          onClose={() => setTalkOpen(false)}
          onDone={async (text) => {
            await send(text);
          }}
        />
      ) : null}
    </>
  );
}

function MessageBlock({
  m,
  agents,
  stream,
  decideApproval,
  onOpenArtifact,
}: {
  m: Message;
  agents: Agent[];
  stream: string;
  decideApproval: (id: string, action: "approve" | "reject" | "edit") => Promise<void>;
  onOpenArtifact: (id: string) => void;
}) {
  if (m.role === "user") {
    return (
      <div className="bub-row right" style={{ marginTop: 12 }}>
        <div className="bubble bub-you">{m.body}</div>
      </div>
    );
  }

  const streaming = m.status === "streaming";
  const body = streaming ? stream : m.body;

  return (
    <div style={{ marginTop: 14 }}>
      <div className="msg-over">{agentName(agents, m.authorId)}</div>
      {streaming && !body ? <div className="meta">Typing…</div> : <div className="prose">{body}</div>}

      {m.trace && m.trace.length > 0 ? <TraceCard trace={m.trace} agents={agents} /> : null}

      {m.artifacts && m.artifacts.length > 0
        ? m.artifacts.map((a) => (
            <button className="chip-link" key={a.id} style={{ width: "100%", textAlign: "left" }} onClick={() => onOpenArtifact(a.id)}>
              <span className="grow">
                <span className="chip-over">Artifact</span>
                <span className="chip-title">{a.name}</span>
              </span>
              <Chevron width={15} height={15} />
            </button>
          ))
        : null}

      {m.approval ? <ApprovalCard approval={m.approval} decideApproval={decideApproval} /> : null}
    </div>
  );
}

function TraceCard({ trace, agents }: { trace: TraceEntry[]; agents: Agent[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="trace">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={() => setOpen((o) => !o)}>
        <div className="grow">
          <div className="trace-over">
            {trace.length} sub-agent{trace.length > 1 ? "s" : ""}
          </div>
          <div className="trace-title">{trace[0]?.title}</div>
        </div>
        {open ? <ChevronDown width={15} height={15} /> : <Chevron width={15} height={15} />}
      </div>
      {open
        ? trace.map((t) => (
            <div key={t.id} style={{ marginTop: 8 }}>
              <div className="trace-over">
                {agentName(agents, t.agentId)} · {t.status}
              </div>
              <div className="trace-title">{t.title}</div>
              {t.detail ? (
                <div className="meta" style={{ marginTop: 2 }}>
                  {t.detail}
                </div>
              ) : null}
            </div>
          ))
        : null}
    </div>
  );
}

function ApprovalCard({
  approval,
  decideApproval,
}: {
  approval: Approval;
  decideApproval: (id: string, action: "approve" | "reject" | "edit") => Promise<void>;
}) {
  const pending = approval.status === "pending";
  const color =
    approval.status === "approved"
      ? "var(--success)"
      : approval.status === "rejected"
        ? "var(--danger)"
        : "var(--warning)";

  return (
    <div className="approval">
      <div className="app-title">{approval.title}</div>
      <div className="meta" style={{ marginTop: 2 }}>
        {approval.meta}
      </div>
      {pending ? (
        <div className="actions">
          <button className="btn btn-primary" onClick={() => void decideApproval(approval.id, "approve")}>
            Approve
          </button>
          <button className="btn btn-ghost" onClick={() => void decideApproval(approval.id, "edit")}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={() => void decideApproval(approval.id, "reject")}>
            Reject
          </button>
        </div>
      ) : (
        <div className="meta" style={{ marginTop: 8, color }}>
          {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
        </div>
      )}
    </div>
  );
}

function NewArtifactModal({
  sessionId,
  onClose,
  onCreated,
}: {
  sessionId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<ArtifactKind>("doc");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const contentFor = (k: ArtifactKind) => {
    switch (k) {
      case "table":
        return { kind: "table" as const, columns: [], rows: [] };
      case "doc":
        return { kind: "doc" as const, body: "" };
      case "canvas":
        return { kind: "canvas" as const, nodes: [] };
      case "dashboard":
        return { kind: "dashboard" as const, widgets: [] };
    }
  };

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await api.createArtifact(sessionId, { kind, name: name.trim() || `${kind} artifact`, content: contentFor(kind) });
      onCreated();
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
          New artifact
        </div>

        <div className="section-label">Kind</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {KINDS.map((k) => (
            <button
              key={k.id}
              className="pill"
              style={{
                background: kind === k.id ? "var(--accent)" : "var(--surface-2)",
                color: kind === k.id ? "var(--on-accent)" : "var(--text-2)",
                border: "none",
                padding: "9px 14px",
                fontSize: 10,
              }}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="section-label">Name</div>
        <input
          className="input"
          style={{ width: "100%" }}
          value={name}
          placeholder={`${kind} artifact`}
          onChange={(e) => setName(e.target.value)}
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

function SessionMenu({
  session,
  onRename,
  onArchive,
  onClose,
}: {
  session: Session;
  onRename: () => void;
  onArchive: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="grabber" />
        <div className="serif" style={{ fontSize: 22, lineHeight: 1, textAlign: "center" }}>
          {session.title}
        </div>
        <div className="meta" style={{ textAlign: "center", marginTop: 4 }}>
          {session.members.length > 1 ? `Shared · ${session.members.length} people` : "Personal"}
        </div>

        <button className="row" style={{ width: "100%", textAlign: "left", marginTop: 16 }} onClick={onRename}>
          <span className="row-title">Rename</span>
          <Chevron width={15} height={15} />
        </button>
        <button className="row" style={{ width: "100%", textAlign: "left" }} onClick={onArchive}>
          <span className="row-title" style={{ color: "var(--danger)" }}>
            Archive
          </span>
          <Chevron width={15} height={15} />
        </button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 14 }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function RenameModal({
  title,
  onClose,
  onSave,
}: {
  title: string;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}) {
  const [value, setValue] = useState(title);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (saving || !value.trim()) return;
    setSaving(true);
    try {
      await onSave(value.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="serif" style={{ fontSize: 24, lineHeight: 1 }}>
          Rename session
        </div>
        <input
          className="input"
          style={{ width: "100%", marginTop: 14 }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => void save()} disabled={saving || !value.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function activity(messages: Message[], agents: Agent[]): { kind: string; title: string; meta: string }[] {
  const out: { kind: string; title: string; meta: string }[] = [];
  for (const m of messages) {
    if (m.role === "user") out.push({ kind: "accent", title: "You sent a message", meta: relativeTime(m.createdAt) });
    else if (m.status === "complete")
      out.push({ kind: "ok", title: `${agentName(agents, m.authorId)} replied`, meta: relativeTime(m.createdAt) });
    if (m.approval) {
      const st = m.approval.status;
      const kind = st === "approved" ? "ok" : st === "rejected" ? "run" : "accent";
      const label = st === "pending" ? `Awaiting approval — ${m.approval.title}` : `Approval ${st} — ${m.approval.title}`;
      out.push({ kind, title: label, meta: relativeTime(m.approval.createdAt) });
    }
  }
  return out.reverse();
}
